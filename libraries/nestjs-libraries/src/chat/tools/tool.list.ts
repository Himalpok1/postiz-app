import { IntegrationValidationTool } from '@gitroom/nestjs-libraries/chat/tools/integration.validation.tool';
import { IntegrationTriggerTool } from '@gitroom/nestjs-libraries/chat/tools/integration.trigger.tool';
import { IntegrationSchedulePostTool } from './integration.schedule.post';
import { IntegrationListTool } from '@gitroom/nestjs-libraries/chat/tools/integration.list.tool';
import { GroupListTool } from '@gitroom/nestjs-libraries/chat/tools/group.list.tool';
import { UploadFromUrlTool } from '@gitroom/nestjs-libraries/chat/tools/upload.from.url.tool';
import { MediaListTool } from '@gitroom/nestjs-libraries/chat/tools/media.list.tool';
import { MediaStatusTool } from '@gitroom/nestjs-libraries/chat/tools/media.status.tool';
import { PostsListTool } from '@gitroom/nestjs-libraries/chat/tools/posts.list.tool';
import { PostSettingsTool } from '@gitroom/nestjs-libraries/chat/tools/post.settings.tool';
import { DeletePostTool } from '@gitroom/nestjs-libraries/chat/tools/delete.post.tool';
import { UploadWidgetTool } from '@gitroom/nestjs-libraries/chat/tools/upload.widget.tool';
import { UploadWidgetTicketTool } from '@gitroom/nestjs-libraries/chat/tools/upload.widget.ticket.tool';
import { UploadWidgetStatusTool } from '@gitroom/nestjs-libraries/chat/tools/upload.widget.status.tool';

export const toolList = [
  IntegrationListTool,
  GroupListTool,
  IntegrationValidationTool,
  IntegrationTriggerTool,
  IntegrationSchedulePostTool,
  PostsListTool,
  PostSettingsTool,
  DeletePostTool,
  UploadFromUrlTool,
  MediaListTool,
  MediaStatusTool,
  UploadWidgetTool,
  UploadWidgetTicketTool,
  UploadWidgetStatusTool,
];
