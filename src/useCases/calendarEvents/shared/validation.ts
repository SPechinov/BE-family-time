import { CalendarEventIterationType, CalendarEventRecurrencePattern } from '@/entities';
import { ErrorCalendarEventInvalidDateRange, ErrorCalendarEventRecurrencePattern, ILogger } from '@/pkg';

export const validateRecurrencePatternOrThrow = (
  iterationType: CalendarEventIterationType,
  recurrencePattern: CalendarEventRecurrencePattern | null | undefined,
  logger: ILogger,
): void => {
  if (iterationType === 'oneTime' || iterationType === 'yearly') {
    if (recurrencePattern) {
      logger.warn({ iterationType, recurrencePattern }, 'recurrencePattern must not be set for this iterationType');
      throw new ErrorCalendarEventRecurrencePattern();
    }
    return;
  }

  if (!recurrencePattern) {
    logger.warn({ iterationType }, 'recurrencePattern is required for this iterationType');
    throw new ErrorCalendarEventRecurrencePattern();
  }

  if (iterationType === 'weekly') {
    if (recurrencePattern.type !== 'weekly') {
      logger.warn(
        { iterationType, recurrencePatternType: recurrencePattern.type },
        'recurrencePattern type must be weekly for weekly iterationType',
      );
      throw new ErrorCalendarEventRecurrencePattern();
    }
    if (recurrencePattern.dayOfWeek < 0 || recurrencePattern.dayOfWeek > 6) {
      logger.warn(
        { iterationType, dayOfWeek: recurrencePattern.dayOfWeek },
        'recurrencePattern dayOfWeek must be between 0 and 6',
      );
      throw new ErrorCalendarEventRecurrencePattern();
    }
  }

  if (iterationType === 'monthly') {
    if (recurrencePattern.type !== 'monthly') {
      logger.warn(
        { iterationType, recurrencePatternType: recurrencePattern.type },
        'recurrencePattern type must be monthly for monthly iterationType',
      );
      throw new ErrorCalendarEventRecurrencePattern();
    }
    if (recurrencePattern.dayOfMonth < 0 || recurrencePattern.dayOfMonth > 30) {
      logger.warn(
        { iterationType, dayOfMonth: recurrencePattern.dayOfMonth },
        'recurrencePattern dayOfMonth must be between 0 and 30',
      );
      throw new ErrorCalendarEventRecurrencePattern();
    }
  }
};

export const validateDateRangeOrThrow = (startDate: Date, endDate?: Date | null): void => {
  if (endDate !== null && endDate !== undefined && endDate < startDate) {
    throw new ErrorCalendarEventInvalidDateRange();
  }
};
