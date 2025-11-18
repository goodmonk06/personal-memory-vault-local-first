import { INotificationAdapter, Notification } from '../index';
import { logger } from '../../logger';

/**
 * Console notification adapter
 * Simple implementation that logs notifications to console
 */
export class ConsoleNotificationAdapter implements INotificationAdapter {
  async send(notification: Notification): Promise<void> {
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
    }[notification.type];

    logger.info(`${emoji} Notification: ${notification.title}`, {
      message: notification.message,
      type: notification.type,
      metadata: notification.metadata,
    });
  }
}
