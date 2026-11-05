import { Injectable } from '@nestjs/common';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { hasLinks } from '@gitroom/helpers/utils/strip.links';
import {
  pricing,
  PublishLimit,
} from '@gitroom/nestjs-libraries/database/prisma/subscriptions/pricing';
import { UsageRepository } from '@gitroom/nestjs-libraries/database/prisma/usage/usage.repository';

dayjs.extend(utc);

const BYTES_IN_GB = 1024 * 1024 * 1024;

export interface PublishReservation {
  providerIdentifier: string;
  periodStart: Date;
  posts: number;
  linkPosts: number;
}

export interface ScheduledGroup {
  providerIdentifier: string;
  date: string | Date;
  contents: string[];
  existingIds: string[];
}

@Injectable()
export class UsageService {
  constructor(private _usageRepository: UsageRepository) {}

  // Without billing every organization counts as paid (same as
  // PermissionsService.getPackageOptions), and the limits still apply there
  private async getPlan(organizationId: string) {
    const subscription = await this._usageRepository.getSubscription(
      organizationId
    );
    const tier =
      subscription?.subscriptionTier ||
      (!process.env.STRIPE_PUBLISHABLE_KEY ? 'PRO' : 'FREE');

    return {
      plan: pricing[tier],
      anchor:
        subscription?.createdAt ||
        (await this._usageRepository.getOrganizationCreatedAt(organizationId))
          ?.createdAt ||
        new Date(),
    };
  }

  // Months follow the subscription date like the posts-per-month check in
  // PermissionsService, days are UTC days
  private getPeriod(limit: PublishLimit, anchor: Date, at: dayjs.ConfigType) {
    const date = dayjs.utc(at);
    if (limit.period === 'day') {
      const from = date.startOf('day');
      return { from: from.toDate(), to: from.add(1, 'day').toDate() };
    }

    const start = dayjs.utc(anchor);
    const months = Math.max(date.diff(start, 'month'), 0);
    return {
      from: start.add(months, 'month').toDate(),
      to: start.add(months + 1, 'month').toDate(),
    };
  }

  private limitMessage(limit: PublishLimit, total: number, withLinks: boolean) {
    return `Your plan's limit of ${total} ${limit.label} ${
      withLinks ? 'posts with links' : 'posts'
    } per ${limit.period} has been reached. Upgrade your plan or wait until the limit resets.`;
  }

  // The whole thread is reserved when its first post publishes, so a limit can
  // never cut a thread in half. Returns the reservation to give back if nothing
  // was published, or an error message when the limit was reached.
  async reservePublish(
    organizationId: string,
    providerIdentifier: string,
    contents: string[]
  ): Promise<{ reservation?: PublishReservation; error?: string }> {
    const { plan, anchor } = await this.getPlan(organizationId);
    const limit = plan.publish_limits[providerIdentifier];
    if (!limit) {
      return {};
    }

    const posts = contents.length;
    const linkPosts =
      limit.link_posts === undefined
        ? 0
        : contents.filter((content) => hasLinks(content)).length;
    const { from } = this.getPeriod(limit, anchor, new Date());

    const reserved = await this._usageRepository.reservePublishUsage(
      organizationId,
      providerIdentifier,
      from,
      posts,
      linkPosts,
      limit.posts,
      limit.link_posts
    );

    if (reserved) {
      return {
        reservation: {
          providerIdentifier,
          periodStart: from,
          posts,
          linkPosts,
        },
      };
    }

    const usage = await this._usageRepository.getPublishUsage(
      organizationId,
      providerIdentifier,
      from
    );

    return {
      error:
        limit.link_posts !== undefined &&
        linkPosts > 0 &&
        (usage?.posts || 0) + posts <= limit.posts
          ? this.limitMessage(limit, limit.link_posts, true)
          : this.limitMessage(limit, limit.posts, false),
    };
  }

  async releasePublish(
    organizationId: string,
    reservation?: PublishReservation
  ) {
    if (!reservation) {
      return;
    }

    await this._usageRepository.releasePublishUsage(
      organizationId,
      reservation.providerIdentifier,
      reservation.periodStart,
      reservation.posts,
      reservation.linkPosts
    );
  }

  // Scheduling more than the plan allows is refused right away, instead of
  // failing on the day it should have been published. The check at publish
  // time remains what really enforces the limit.
  async scheduleLimitMessage(
    organizationId: string,
    groups: ScheduledGroup[]
  ): Promise<string | undefined> {
    const { plan, anchor } = await this.getPlan(organizationId);
    const pending = new Map<string, { posts: number; linkPosts: number }>();

    for (const group of groups) {
      const limit = plan.publish_limits[group.providerIdentifier];
      if (!limit) {
        continue;
      }

      const { from, to } = this.getPeriod(limit, anchor, group.date);
      const key = `${group.providerIdentifier}_${from.toISOString()}`;

      if (!pending.has(key)) {
        const [usage, queued] = await Promise.all([
          this._usageRepository.getPublishUsage(
            organizationId,
            group.providerIdentifier,
            from
          ),
          this._usageRepository.getQueuedPosts(
            organizationId,
            group.providerIdentifier,
            from,
            to,
            groups.flatMap((g) => g.existingIds)
          ),
        ]);

        pending.set(key, {
          posts: (usage?.posts || 0) + queued.length,
          linkPosts:
            (usage?.linkPosts || 0) +
            queued.filter((post) => hasLinks(post.content)).length,
        });
      }

      const total = pending.get(key)!;
      total.posts += group.contents.length;
      total.linkPosts += group.contents.filter((c) => hasLinks(c)).length;

      if (total.posts > limit.posts) {
        return this.limitMessage(limit, limit.posts, false);
      }

      if (limit.link_posts !== undefined && total.linkPosts > limit.link_posts) {
        return this.limitMessage(limit, limit.link_posts, true);
      }
    }

    return undefined;
  }

  async storageLimitMessage(
    organizationId: string,
    usedBytes: number,
    addedBytes: number
  ): Promise<string | undefined> {
    const { plan } = await this.getPlan(organizationId);
    if (usedBytes + addedBytes <= plan.storage_gb * BYTES_IN_GB) {
      return undefined;
    }

    return `Your plan's storage limit of ${plan.storage_gb} GB has been reached. Delete some files or upgrade your plan.`;
  }

  async getUsage(organizationId: string, storageUsedBytes: number) {
    const { plan, anchor } = await this.getPlan(organizationId);

    return {
      storage: { used: storageUsedBytes, limit: plan.storage_gb * BYTES_IN_GB },
      publish: await Promise.all(
        Object.entries(plan.publish_limits).map(
          async ([providerIdentifier, limit]) => {
            const { from, to } = this.getPeriod(limit, anchor, new Date());
            const usage = await this._usageRepository.getPublishUsage(
              organizationId,
              providerIdentifier,
              from
            );

            return {
              provider: providerIdentifier,
              label: limit.label,
              period: limit.period,
              resetsAt: to,
              posts: usage?.posts || 0,
              postsLimit: limit.posts,
              ...(limit.link_posts !== undefined
                ? {
                    linkPosts: usage?.linkPosts || 0,
                    linkPostsLimit: limit.link_posts,
                  }
                : {}),
            };
          }
        )
      ),
    };
  }

  deleteAllUsage(organizationId: string) {
    return this._usageRepository.deleteAllPublishUsage(organizationId);
  }
}
