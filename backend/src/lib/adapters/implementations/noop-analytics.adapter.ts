import { IAnalyticsAdapter, AnalyticsEvent } from '../index';
import { logger } from '../../logger';

/**
 * No-op analytics adapter
 * Default implementation that just logs events
 */
export class NoOpAnalyticsAdapter implements IAnalyticsAdapter {
  async track(event: AnalyticsEvent): Promise<void> {
    logger.debug('Analytics event tracked', {
      name: event.name,
      properties: event.properties,
      userId: event.userId,
      timestamp: event.timestamp || new Date().toISOString(),
    });
  }
}
