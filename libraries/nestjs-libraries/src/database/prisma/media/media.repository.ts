import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { SaveMediaInformationDto } from '@gitroom/nestjs-libraries/dtos/media/save.media.information.dto';

@Injectable()
export class MediaRepository {
  constructor(
    private _media: PrismaRepository<'media'>,
    private _post: PrismaRepository<'post'>,
    private _sets: PrismaRepository<'sets'>
  ) {}

  saveFile(
    org: string,
    fileName: string,
    filePath: string,
    originalName?: string,
    fileSize = 0,
    status = 'ready'
  ) {
    return this._media.model.media.create({
      data: {
        organization: {
          connect: {
            id: org,
          },
        },
        name: fileName,
        path: filePath,
        originalName: originalName || null,
        fileSize,
        status,
      },
      select: {
        id: true,
        name: true,
        originalName: true,
        path: true,
        thumbnail: true,
        alt: true,
        status: true,
      },
    });
  }

  startProcessing(org: string, id: string) {
    return this._media.model.media.update({
      where: { id, organizationId: org },
      data: { status: 'processing', processingError: null },
      select: { id: true, status: true },
    });
  }

  finishProcessing(
    org: string,
    id: string,
    data: { name?: string; path?: string; fileSize?: number; error?: string }
  ) {
    return this._media.model.media.update({
      where: { id, organizationId: org },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.path ? { path: data.path } : {}),
        ...(data.fileSize ? { fileSize: data.fileSize } : {}),
        status: data.error ? 'failed' : 'ready',
        processingError: data.error || null,
      },
      select: { id: true, status: true },
    });
  }

  getMediaStatus(org: string, id: string) {
    return this._media.model.media.findFirst({
      where: {
        id,
        organizationId: org,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        originalName: true,
        path: true,
        thumbnail: true,
        alt: true,
        status: true,
        processingError: true,
      },
    });
  }

  getMediaById(id: string) {
    return this._media.model.media.findUnique({
      where: {
        id,
      },
    });
  }

  deleteMedia(org: string, id: string, fileRemoved = false) {
    return this._media.model.media.update({
      where: {
        id,
        organizationId: org,
      },
      data: {
        deletedAt: new Date(),
        // the file is gone, so it stops counting against the storage limit
        ...(fileRemoved ? { fileSize: 0 } : {}),
      },
    });
  }

  // A post that hasn't been published yet, or a saved set, still needs the file
  async isMediaInUse(org: string, path: string) {
    const [posts, sets, media] = await Promise.all([
      this._post.model.post.count({
        where: {
          organizationId: org,
          deletedAt: null,
          // a published repeat post publishes again with the same files
          OR: [
            { state: { in: ['QUEUE', 'DRAFT'] } },
            { intervalInDays: { not: null } },
          ],
          image: { contains: path },
        },
      }),
      this._sets.model.sets.count({
        where: { organizationId: org, content: { contains: path } },
      }),
      this._media.model.media.count({
        where: {
          path,
          organizationId: org,
          OR: [
            { userPicture: { some: {} } },
            { oauthApps: { some: {} } },
            { agencies: { some: {} } },
          ],
        },
      }),
    ]);

    return posts + sets + media > 0;
  }

  // The bucket key comes from the client on some upload routes, so a file is
  // only removed when no other organization's media points at it
  async isPathSharedWithOtherOrg(org: string, path: string) {
    const count = await this._media.model.media.count({
      where: { path, organizationId: { not: org } },
    });
    return count > 0;
  }

  async isPathRegistered(path: string) {
    const count = await this._media.model.media.count({
      where: { path },
    });
    return count > 0;
  }

  async getStorageUsed(org: string) {
    const { _sum } = await this._media.model.media.aggregate({
      where: { organizationId: org },
      _sum: { fileSize: true },
    });
    return _sum.fileSize || 0;
  }

  // Files saved before sizes were recorded have a fileSize of 0
  getUnmeasuredMedia(org: string, take: number) {
    return this._media.model.media.findMany({
      where: { organizationId: org, deletedAt: null, fileSize: 0 },
      select: { id: true, path: true },
      take,
    });
  }

  setFileSize(id: string, fileSize: number) {
    return this._media.model.media.update({
      where: { id },
      data: { fileSize },
      select: { id: true },
    });
  }

  getAllMediaFiles(org: string) {
    return this._media.model.media.findMany({
      where: { organizationId: org },
      select: { id: true, path: true, thumbnail: true },
    });
  }

  deleteMediaRows(org: string, ids: string[]) {
    return this._media.model.media.deleteMany({
      where: { organizationId: org, id: { in: ids } },
    });
  }

  deleteRow(org: string, id: string) {
    return this._media.model.media.deleteMany({
      where: { organizationId: org, id },
    });
  }

  deleteThumbnailRows(org: string, path: string) {
    return this._media.model.media.deleteMany({
      where: { organizationId: org, path, status: 'thumbnail' },
    });
  }

  saveMediaInformation(org: string, data: SaveMediaInformationDto) {
    return this._media.model.media.update({
      where: {
        id: data.id,
        organizationId: org,
      },
      data: {
        alt: data.alt,
        thumbnail: data.thumbnail,
        thumbnailTimestamp: data.thumbnailTimestamp,
      },
      select: {
        id: true,
        name: true,
        originalName: true,
        alt: true,
        thumbnail: true,
        path: true,
        thumbnailTimestamp: true,
      },
    });
  }

  async getMedia(org: string, page: number, search?: string) {
    const pageNum = (page || 1) - 1;
    const trimmedSearch = search?.trim();
    const searchFilter = trimmedSearch
      ? {
          originalName: {
            contains: trimmedSearch,
            mode: 'insensitive' as const,
          },
        }
      : {};
    const query = {
      where: {
        organization: {
          id: org,
        },
        deletedAt: null,
        status: { notIn: ['processing', 'thumbnail'] },
        ...searchFilter,
      },
    };
    const pages = Math.ceil((await this._media.model.media.count(query)) / 18);
    const results = await this._media.model.media.findMany({
      where: {
        organizationId: org,
        deletedAt: null,
        // still being normalized: it shows up once the workflow releases it
        status: { notIn: ['processing', 'thumbnail'] },
        ...searchFilter,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        originalName: true,
        path: true,
        thumbnail: true,
        alt: true,
        thumbnailTimestamp: true,
        createdAt: true,
      },
      skip: pageNum * 18,
      take: 18,
    });

    return {
      pages,
      results,
    };
  }
}
