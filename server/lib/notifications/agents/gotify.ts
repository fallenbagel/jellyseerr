import { IssueStatus, IssueTypeName } from '@server/constants/issue';
import type { NotificationAgentGotify } from '@server/lib/settings';
import { getSettings } from '@server/lib/settings';
import logger from '@server/logger';
import { hasNotificationType, Notification } from '..';
import type { NotificationAgent, NotificationPayload } from './agent';
import { BaseAgent } from './agent';

interface GotifyPayload {
  title: string;
  message: string;
  priority: number;
  extras: Record<string, unknown>;
}

class GotifyAgent
  extends BaseAgent<NotificationAgentGotify>
  implements NotificationAgent
{
  protected getSettings(): NotificationAgentGotify {
    if (this.settings) {
      return this.settings;
    }

    const settings = getSettings();

    return settings.notifications.agents.gotify;
  }

  public shouldSend(): boolean {
    const settings = this.getSettings();

    if (settings.enabled && settings.options.url && settings.options.token) {
      return true;
    }

    return false;
  }

  private getNotificationPayload(
    type: Notification,
    payload: NotificationPayload
  ): GotifyPayload {
    const { applicationUrl, applicationTitle } = getSettings().main;
    let priority = 0;

    const title = payload.event
      ? `${payload.event} - ${payload.subject}`
      : payload.subject;
    let message = payload.message ?? '';

    if (payload.request) {
      message += `\n\nRequested By: ${payload.request.requestedBy.displayName}`;

      let status = '';
      switch (type) {
        case Notification.MEDIA_PENDING:
          status = 'Pending Approval';
          break;
        case Notification.MEDIA_APPROVED:
        case Notification.MEDIA_AUTO_APPROVED:
          status = 'Processing';
          break;
        case Notification.MEDIA_AVAILABLE:
          status = 'Available';
          break;
        case Notification.MEDIA_DECLINED:
          status = 'Declined';
          break;
        case Notification.MEDIA_FAILED:
          status = 'Failed';
          break;
      }

      if (status) {
        message += `\nRequest Status: ${status}`;
      }
    } else if (payload.comment) {
      message += `\nComment from ${payload.comment.user.displayName}:\n${payload.comment.message}`;
    } else if (payload.issue) {
      message += `\n\nReported By: ${payload.issue.createdBy.displayName}`;
      message += `\nIssue Type: ${IssueTypeName[payload.issue.issueType]}`;
      message += `\nIssue Status: ${
        payload.issue.status === IssueStatus.OPEN ? 'Open' : 'Resolved'
      }`;

      if (type == Notification.ISSUE_CREATED) {
        priority = 1;
      }
    }

    for (const extra of payload.extra ?? []) {
      message += `\n\n**${extra.name}**\n${extra.value}`;
    }

    if (applicationUrl && payload.media) {
      const actionUrl = `${applicationUrl}/${payload.media.mediaType}/${payload.media.tmdbId}`;
      message += `\n\nOpen in ${applicationTitle}(${actionUrl})`;
    }

    return {
      extras: {
        'client::display': {
          contentType: 'text/markdown',
        },
      },
      title,
      message,
      priority,
    };
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

    logger.debug('Sending Gotify notification', {
      label: 'Notifications',
      type: Notification[type],
      subject: payload.subject,
    });
    try {
      const endpoint = `${settings.options.url}/message?token=${settings.options.token}`;
      const notificationPayload = this.getNotificationPayload(type, payload);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationPayload),
      });
      if (!response.ok) {
        throw new Error(response.statusText, { cause: response });
      }

      return true;
    } catch (e) {
      let errorData;
      try {
        errorData = await e.cause?.text();
        errorData = JSON.parse(errorData);
      } catch {
        /* empty */
      }
      logger.error('Error sending Gotify notification', {
        label: 'Notifications',
        type: Notification[type],
        subject: payload.subject,
        errorMessage: e.message,
        response: errorData,
      });

      return false;
    }
  }
}

export default GotifyAgent;
