import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PostMetricsRepository {
  constructor(
    private _postMetrics: PrismaRepository<'postMetrics'>,
    private _post: PrismaRepository<'post'>,
    private _integration: PrismaRepository<'integration'>
  ) {}

  getChannels(providerIdentifier: string) {
    return this._integration.model.integration.findMany({
      where: {
        providerIdentifier,
        deletedAt: null,
        disabled: false,
        refreshNeeded: false,
        ...(process.env.STRIPE_SECRET_KEY
          ? { organization: { subscription: { deletedAt: null } } }
          : {}),
      },
      select: {
        id: true,
        token: true,
      },
    });
  }

  // Repeat posts stay out: each occurrence replaces the release id on one row,
  // so a stored read couldn't say which occurrence it belongs to
  private readablePosts(integrationId: string) {
    return {
      integrationId,
      state: 'PUBLISHED' as const,
      deletedAt: null,
      parentPostId: null,
      intervalInDays: null,
      AND: [{ releaseId: { not: null } }, { releaseId: { not: 'missing' } }],
    };
  }

  // The posts published first in a month are the ones tracked
  getPostsDueFirstRead(integrationId: string, from: Date, to: Date, take: number) {
    return this._post.model.post.findMany({
      where: {
        ...this.readablePosts(integrationId),
        metrics: null,
        publishDate: { gte: from, lt: to },
      },
      select: {
        id: true,
        releaseId: true,
        publishDate: true,
      },
      orderBy: {
        publishDate: 'asc',
      },
      take,
    });
  }

  getPostsDueRead(integrationId: string, reads: number, publishedBy: Date) {
    return this._post.model.post.findMany({
      where: {
        ...this.readablePosts(integrationId),
        metrics: { reads },
        publishDate: { lte: publishedBy },
      },
      select: {
        id: true,
        releaseId: true,
        publishDate: true,
      },
    });
  }

  countTrackedPosts(integrationId: string, from: Date, to: Date) {
    return this._postMetrics.model.postMetrics.count({
      where: {
        integrationId,
        publishDate: { gte: from, lt: to },
      },
    });
  }

  // Counted before the platform is asked, so no failure afterwards can lead to
  // paying for the same read again
  claimRead(postId: string, integrationId: string, publishDate: Date) {
    return this._postMetrics.model.postMetrics.upsert({
      where: {
        postId,
      },
      create: {
        postId,
        integrationId,
        publishDate,
        reads: 1,
      },
      update: {
        reads: { increment: 1 },
      },
      select: {
        postId: true,
      },
    });
  }

  async releaseRead(postId: string) {
    await this._postMetrics.model.postMetrics.updateMany({
      where: {
        postId,
      },
      data: {
        reads: { decrement: 1 },
      },
    });

    await this._postMetrics.model.postMetrics.deleteMany({
      where: {
        postId,
        reads: { lte: 0 },
      },
    });
  }

  saveMetrics(postId: string, metrics: Record<string, number>) {
    return this._postMetrics.model.postMetrics.updateMany({
      where: {
        postId,
      },
      data: {
        metrics: JSON.stringify(metrics),
      },
    });
  }

  getChannelMetrics(organizationId: string, integrationId: string, from: Date) {
    return this._postMetrics.model.postMetrics.findMany({
      where: {
        integrationId,
        publishDate: { gte: from },
        post: {
          organizationId,
          deletedAt: null,
        },
      },
      select: {
        metrics: true,
      },
    });
  }

  getPostMetrics(postId: string) {
    return this._postMetrics.model.postMetrics.findUnique({
      where: {
        postId,
      },
      select: {
        metrics: true,
        updatedAt: true,
      },
    });
  }
}
