import { Injectable } from '@nestjs/common';
import { AutopostRepository } from '@gitroom/nestjs-libraries/database/prisma/autopost/autopost.repository';
import { AutopostDto } from '@gitroom/nestjs-libraries/dtos/autopost/autopost.dto';
import dayjs from 'dayjs';
import { END, START, StateGraph } from '@langchain/langgraph';
import { AutoPost, Integration } from '@prisma/client';
import { BaseMessage } from '@langchain/core/messages';
import striptags from 'striptags';
import { PostsService } from '@gitroom/nestjs-libraries/database/prisma/posts/posts.service';
import Parser from 'rss-parser';
import { IntegrationService } from '@gitroom/nestjs-libraries/database/prisma/integrations/integration.service';
import { makeId } from '@gitroom/nestjs-libraries/services/make.is';
import { TemporalService } from 'nestjs-temporal-core';
import { TypedSearchAttributes } from '@temporalio/common';
import {
  organizationId,
} from '@gitroom/nestjs-libraries/temporal/temporal.search.attribute';
const parser = new Parser();

interface WorkflowChannelsState {
  messages: BaseMessage[];
  integrations: Integration[];
  body: AutoPost;
  description: string;
  image: string;
  id: string;
  load: {
    date: string;
    url: string;
    description: string;
  };
}

@Injectable()
export class AutopostService {
  constructor(
    private _autopostsRepository: AutopostRepository,
    private _temporalService: TemporalService,
    private _integrationService: IntegrationService,
    private _postsService: PostsService
  ) {}

  async stopAll(org: string) {
    const getAll = (await this.getAutoposts(org)).filter((f) => f.active);
    for (const autopost of getAll) {
      await this.changeActive(org, autopost.id, false);
    }
  }

  getAutoposts(orgId: string) {
    return this._autopostsRepository.getAutoposts(orgId);
  }

  async createAutopost(orgId: string, body: AutopostDto, id?: string) {
    const data = await this._autopostsRepository.createAutopost(
      orgId,
      body,
      id
    );

    await this.processCron(body.active, orgId, data.id);

    return data;
  }

  async changeActive(orgId: string, id: string, active: boolean) {
    const data = await this._autopostsRepository.changeActive(
      orgId,
      id,
      active
    );
    await this.processCron(active, orgId, id);
    return data;
  }

  async processCron(active: boolean, orgId: string, id: string) {
    if (active) {
      try {
        return await this._temporalService.client
          .getRawClient()
          ?.workflow.start('autoPostWorkflow', {
            workflowId: `autopost-${id}`,
            taskQueue: 'main',
            args: [{ id, immediately: true }],
            // Keep a running workflow, it reads the autopost settings on every run
            workflowIdConflictPolicy: 'USE_EXISTING',
            typedSearchAttributes: new TypedSearchAttributes([
              {
                key: organizationId,
                value: orgId,
              },
            ]),
          });
      } catch (err) {
        // Don't fall through and terminate an active autopost
        return false;
      }
    }

    try {
      return await this._temporalService.terminateWorkflow(`autopost-${id}`);
    } catch (err) {
      return false;
    }
  }

  async deleteAutopost(orgId: string, id: string) {
    const data = await this._autopostsRepository.deleteAutopost(orgId, id);
    await this.processCron(false, orgId, id);
    return data;
  }

  async loadXML(url: string) {
    try {
      const { items } = await parser.parseURL(url);
      const findLast = items.reduce(
        (all: any, current: any) => {
          if (dayjs(current.pubDate).isAfter(all.pubDate)) {
            return current;
          }
          return all;
        },
        { pubDate: dayjs().subtract(100, 'years') }
      );

      return {
        success: true,
        date: findLast.pubDate,
        url: findLast.link,
        description: striptags(
          findLast?.['content:encoded'] ||
            findLast?.content ||
            findLast?.description ||
            ''
        )
          .replace(/\n/g, ' ')
          .trim(),
      };
    } catch (err) {
      /** sent **/
    }

    return { success: false };
  }

  static state = () =>
    new StateGraph<WorkflowChannelsState>({
      channels: {
        messages: {
          reducer: (currentState, updateValue) =>
            currentState.concat(updateValue),
          default: () => [],
        },
        body: null,
        description: null,
        load: null,
        image: null,
        integrations: null,
        id: null,
      },
    });

  async generateDescription(state: WorkflowChannelsState) {
    return {
      ...state,
      // No custom text set: post the feed item's own description instead
      description: state.body.content || state.load.description || '',
    };
  }

  async schedulePost(state: WorkflowChannelsState) {
    const nextTime = await this._postsService.findFreeDateTime(
      state.integrations[0].organizationId
    );

    await this._postsService.createPost(state.integrations[0].organizationId, {
      date: nextTime + 'Z',
      order: makeId(10),
      shortLink: false,
      type: 'draft',
      tags: [],
      posts: state.integrations.map((i) => ({
        settings: {
          __type: i.providerIdentifier as any,
          title: '',
          tags: [],
          subreddit: [],
        },
        group: makeId(10),
        integration: { id: i.id },
        value: [
          {
            id: makeId(10),
            delay: 0,
            content: [
              state.description.replace(/\n/g, '\n\n'),
              state.load.url,
            ]
              .filter((text) => text)
              .join('\n\n'),
            image: !state.image
              ? []
              : [
                  {
                    id: makeId(10),
                    name: makeId(10),
                    path: state.image,
                    organizationId: state.integrations[0].organizationId,
                  },
                ],
          },
        ],
      })),
    }, 'AUTOPOST');
  }

  async updateUrl(state: WorkflowChannelsState) {
    await this._autopostsRepository.updateUrl(state.id, state.load.url);
  }

  async startAutopost(id: string) {
    const getPost = await this._autopostsRepository.getAutopost(id);
    if (!getPost || !getPost.active) {
      return;
    }

    const load = await this.loadXML(getPost.url);
    if (!load.success || load.url === getPost.lastUrl) {
      return;
    }

    const integrations = await this._integrationService.getIntegrationsList(
      getPost.organizationId
    );

    const parseIntegrations = JSON.parse(getPost.integrations || '[]') || [];
    const neededIntegrations = integrations.filter((i) =>
      parseIntegrations.some((ii: any) => ii.id === i.id)
    );

    const integrationsToSend =
      parseIntegrations.length === 0 ? integrations : neededIntegrations;
    if (integrationsToSend.length === 0) {
      return;
    }

    const state = AutopostService.state();
    const workflow = state
      .addNode('generate-description', this.generateDescription.bind(this))
      .addNode('schedule-post', this.schedulePost.bind(this))
      .addNode('update-url', this.updateUrl.bind(this))
      .addEdge(START, 'generate-description')
      .addEdge('generate-description', 'schedule-post')
      .addEdge('schedule-post', 'update-url')
      .addEdge('update-url', END);

    const app = workflow.compile();
    await app.invoke({
      messages: [],
      id,
      body: getPost,
      load,
      integrations: integrationsToSend,
    });
  }
}
