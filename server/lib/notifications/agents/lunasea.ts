import { IssueStatus, IssueType } from '@server/constants/issue';
import { MediaStatus } from '@server/constants/media';
import type { NotificationAgentLunaSea } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import axios from 'axios';
import { hasNotificationType, Notification } from '..';
import type { NotificationAgent, NotificationPayload } from './agent';
import { BaseAgent } from './agent';

class LunaSeaAgent
  extends BaseAgent<NotificationAgentLunaSea>
  implements NotificationAgent
{
  protected getSettings(): NotificationAgentLunaSea {
    if (this.settings) {
      return this.settings;
    }

    const settings = getSettings();

    return settings.notifications.agents.lunasea;
  }

  private buildPayload(type: Notification, payload: NotificationPayload) {
    return {
      notification_type: Notification[type],
      event: payload.event,
      subject: payload.subject,
      message: payload.message,
      image: payload.image ?? null,
      email: payload.notifyUser?.email,
      username: payload.notifyUser?.displayName,
      avatar: payload.notifyUser?.avatar,
      media: payload.media
        ? {
            media_type: payload.media.mediaType,
            tmdbId: payload.media.tmdbId,
            tvdbId: payload.media.tvdbId,
            status: MediaStatus[payload.media.status],
            status4k: MediaStatus[payload.media.status4k],
          }
        : null,
      extra: payload.extra ?? [],
      request: payload.request
        ? {
            request_id: payload.request.id,
            requestedBy_email: payload.request.requestedBy.email,
            requestedBy_username: payload.request.requestedBy.displayName,
            requestedBy_avatar: payload.request.requestedBy.avatar,
          }
        : null,
      issue: payload.issue
        ? {
            issue_id: payload.issue.id,
            issue_type: IssueType[payload.issue.issueType],
            issue_status: IssueStatus[payload.issue.status],
            createdBy_email: payload.issue.createdBy.email,
            createdBy_username: payload.issue.createdBy.displayName,
            createdBy_avatar: payload.issue.createdBy.avatar,
          }
        : null,
      comment: payload.comment
        ? {
            comment_message: payload.comment.message,
            commentedBy_email: payload.comment.user.email,
            commentedBy_username: payload.comment.user.displayName,
            commentedBy_avatar: payload.comment.user.avatar,
          }
        : null,
    };
  }

  public shouldSend(): boolean {
    const settings = this.getSettings();

    if (settings.enabled && settings.options.webhookUrl) {
      return true;
    }

    return false;
  }

  public async send(
    type: Notification,
    payload: NotificationPayload
  ): Promise<boolean> {
    const settings = this.getSettings();

    if (
      !payload.notifySystem ||
      !hasNotificationType(type, settings.types ?? 0)
    ) {
      return true;
    }

    logger.debug('Sending LunaSea notification', {
      label: 'Notifications',
      type: Notification[type],
      subject: payload.subject,
    });

    try {
      await axios.post(
        settings.options.webhookUrl,
        this.buildPayload(type, payload),
        settings.options.profileName
          ? {
              headers: {
                Authorization: `Basic ${Buffer.from(
                  `${settings.options.profileName}:`
                ).toString('base64')}`,
              },
            }
          : undefined
      );

      return true;
    } catch (e) {
      logger.error('Error sending LunaSea notification', {
        label: 'Notifications',
        type: Notification[type],
        subject: payload.subject,
        errorMessage: e.message,
        response: e?.response?.data,
      });

      return false;
    }
  }
}

export default LunaSeaAgent;
