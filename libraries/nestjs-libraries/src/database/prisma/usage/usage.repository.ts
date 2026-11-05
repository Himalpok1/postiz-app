import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsageRepository {
  constructor(
    private _publishUsage: PrismaRepository<'publishUsage'>,
    private _subscription: PrismaRepository<'subscription'>,
    private _organization: PrismaRepository<'organization'>,
    private _post: PrismaRepository<'post'>
  ) {}

  getSubscription(organizationId: string) {
    return this._subscription.model.subscription.findFirst({
      where: { organizationId, deletedAt: null },
      select: { subscriptionTier: true, createdAt: true },
    });
  }

  getOrganizationCreatedAt(id: string) {
    return this._organization.model.organization.findUnique({
      where: { id },
      select: { createdAt: true },
    });
  }

  getPublishUsage(
    organizationId: string,
    providerIdentifier: string,
    periodStart: Date
  ) {
    return this._publishUsage.model.publishUsage.findUnique({
      where: {
        organizationId_providerIdentifier_periodStart: {
          organizationId,
          providerIdentifier,
          periodStart,
        },
      },
      select: { posts: true, linkPosts: true },
    });
  }

  // The counter is only raised while it stays inside the limits, in one
  // statement, so workers publishing at the same time can't pass the limit
  async reservePublishUsage(
    organizationId: string,
    providerIdentifier: string,
    periodStart: Date,
    posts: number,
    linkPosts: number,
    maxPosts: number,
    maxLinkPosts?: number
  ) {
    // skipDuplicates because another worker may create the row at the same time
    await this._publishUsage.model.publishUsage.createMany({
      data: [{ organizationId, providerIdentifier, periodStart }],
      skipDuplicates: true,
    });

    const { count } = await this._publishUsage.model.publishUsage.updateMany({
      where: {
        organizationId,
        providerIdentifier,
        periodStart,
        posts: { lte: maxPosts - posts },
        ...(maxLinkPosts !== undefined && linkPosts > 0
          ? { linkPosts: { lte: maxLinkPosts - linkPosts } }
          : {}),
      },
      data: {
        posts: { increment: posts },
        linkPosts: { increment: linkPosts },
      },
    });

    return count > 0;
  }

  releasePublishUsage(
    organizationId: string,
    providerIdentifier: string,
    periodStart: Date,
    posts: number,
    linkPosts: number
  ) {
    return this._publishUsage.model.publishUsage.updateMany({
      where: {
        organizationId,
        providerIdentifier,
        periodStart,
        posts: { gte: posts },
        linkPosts: { gte: linkPosts },
      },
      data: {
        posts: { decrement: posts },
        linkPosts: { decrement: linkPosts },
      },
    });
  }

  getQueuedPosts(
    organizationId: string,
    providerIdentifier: string,
    from: Date,
    to: Date,
    excludeIds: string[]
  ) {
    return this._post.model.post.findMany({
      where: {
        organizationId,
        deletedAt: null,
        state: 'QUEUE',
        publishDate: { gte: from, lt: to },
        integration: { providerIdentifier },
        ...(excludeIds.length ? { id: { notIn: excludeIds } } : {}),
      },
      select: { content: true },
    });
  }

  deleteAllPublishUsage(organizationId: string) {
    return this._publishUsage.model.publishUsage.deleteMany({
      where: { organizationId },
    });
  }
}
