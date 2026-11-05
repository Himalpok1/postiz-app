import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { chunk } from 'lodash';
import { IntegrationManager } from '@gitroom/nestjs-libraries/integrations/integration.manager';
import {
  AnalyticsData,
  SocialProvider,
} from '@gitroom/nestjs-libraries/integrations/social/social.integrations.interface';
import { PostMetricsRepository } from '@gitroom/nestjs-libraries/database/prisma/post-metrics/post.metrics.repository';

dayjs.extend(utc);

const FIRST_READ_WINDOW_DAYS = 14;
const READS_PER_REQUEST = 100;

@Injectable()
export class PostMetricsService {
  constructor(
    private _postMetricsRepository: PostMetricsRepository,
    private _integrationManager: IntegrationManager
  ) {}

  async readDueMetrics() {
    for (const identifier of this._integrationManager.getAllowedSocialsIntegrations()) {
      const provider = this._integrationManager.getSocialIntegration(identifier);
      if (provider.meteredAnalytics && provider.readPostMetrics) {
        await this.readProviderMetrics(identifier, provider);
      }
    }
  }

  private async readProviderMetrics(
    identifier: string,
    provider: SocialProvider
  ) {
    const { readAfterHours, postsPerMonth } = provider.meteredAnalytics!;
    const channels = await this._postMetricsRepository.getChannels(identifier);

    for (const channel of channels) {
      const due = [
        ...(await this.getFirstReads(
          channel.id,
          readAfterHours[0],
          postsPerMonth
        )),
        ...(await this.getLaterReads(channel.id, readAfterHours)),
      ];

      for (const batch of chunk(due, READS_PER_REQUEST)) {
        await this.readBatch(provider, channel, batch);
      }
    }
  }

  // Asks only for what's left of each month's cap, so posts over the cap are
  // never selected and can't hold back anyone else's
  private async getFirstReads(
    integrationId: string,
    readAfterHours: number,
    postsPerMonth: number
  ) {
    const now = dayjs.utc();
    const windowStart = now.subtract(FIRST_READ_WINDOW_DAYS, 'day');
    const windowEnd = now.subtract(readAfterHours, 'hour');
    const due = [];

    for (
      let month = windowStart.startOf('month');
      !month.isAfter(windowEnd);
      month = month.add(1, 'month')
    ) {
      const nextMonth = month.add(1, 'month');
      const left =
        postsPerMonth -
        (await this._postMetricsRepository.countTrackedPosts(
          integrationId,
          month.toDate(),
          nextMonth.toDate()
        ));

      if (left > 0) {
        due.push(
          ...(await this._postMetricsRepository.getPostsDueFirstRead(
            integrationId,
            (month.isAfter(windowStart) ? month : windowStart).toDate(),
            (nextMonth.isBefore(windowEnd) ? nextMonth : windowEnd).toDate(),
            left
          ))
        );
      }
    }

    return due;
  }

  private async getLaterReads(integrationId: string, readAfterHours: number[]) {
    const now = dayjs.utc();
    const due = [];

    for (let reads = 1; reads < readAfterHours.length; reads++) {
      due.push(
        ...(await this._postMetricsRepository.getPostsDueRead(
          integrationId,
          reads,
          now.subtract(readAfterHours[reads], 'hour').toDate()
        ))
      );
    }

    return due;
  }

  private async readBatch(
    provider: SocialProvider,
    channel: { id: string; token: string },
    batch: { id: string; releaseId: string | null; publishDate: Date }[]
  ) {
    const claimed: typeof batch = [];
    for (const post of batch) {
      try {
        await this._postMetricsRepository.claimRead(
          post.id,
          channel.id,
          post.publishDate
        );
        claimed.push(post);
      } catch (err) {
        // the post was deleted a moment ago
      }
    }

    if (!claimed.length) {
      return;
    }

    let metrics: Record<string, Record<string, number>>;
    try {
      metrics = await provider.readPostMetrics!(
        channel.token,
        claimed.map((p) => p.releaseId!)
      );
    } catch (err) {
      // Nothing came back, so it's read again on the next run
      console.log('Could not read post metrics', err);
      for (const post of claimed) {
        await this._postMetricsRepository.releaseRead(post.id).catch(() => {});
      }
      return;
    }

    // A post the platform no longer returns keeps what was stored before
    for (const post of claimed) {
      const postMetrics = metrics[post.releaseId!];
      if (postMetrics) {
        await this._postMetricsRepository
          .saveMetrics(post.id, postMetrics)
          .catch((err) => console.log('Could not save post metrics', err));
      }
    }
  }

  async getChannelAnalytics(
    organizationId: string,
    integrationId: string,
    days: number
  ): Promise<AnalyticsData[]> {
    const since = dayjs().subtract(days, 'day');
    const rows = await this._postMetricsRepository.getChannelMetrics(
      organizationId,
      integrationId,
      since.toDate()
    );

    if (!rows.length) {
      return [];
    }

    const totals = rows.reduce((all, row) => {
      const metrics: Record<string, number> = JSON.parse(row.metrics);
      for (const [label, value] of Object.entries(metrics)) {
        all[label] = (all[label] || 0) + value;
      }
      return all;
    }, {} as Record<string, number>);

    return Object.entries(totals).map(([label, total]) => ({
      label,
      percentageChange: 0,
      data: [
        { total: '0', date: since.format('YYYY-MM-DD') },
        { total: String(total), date: dayjs().format('YYYY-MM-DD') },
      ],
    }));
  }

  async getPostAnalytics(postId: string): Promise<AnalyticsData[]> {
    const row = await this._postMetricsRepository.getPostMetrics(postId);
    if (!row) {
      return [];
    }

    const date = dayjs(row.updatedAt).format('YYYY-MM-DD');
    const metrics: Record<string, number> = JSON.parse(row.metrics);

    return Object.entries(metrics).map(([label, total]) => ({
      label,
      percentageChange: 0,
      data: [{ total: String(total), date }],
    }));
  }
}
