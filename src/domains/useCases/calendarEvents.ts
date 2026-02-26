import { UUID } from 'node:crypto';
import { CalendarEventEntity, CalendarEventCreateEntity, CalendarEventPatchEntity } from '@/entities';
import { DefaultProps } from './types';

export interface ICalendarEventsUseCases {
  /**
   * Создать событие в календаре группы
   */
  createCalendarEvent(
    props: DefaultProps<{
      userId: UUID;
      groupId: UUID;
      calendarEventCreateEntity: CalendarEventCreateEntity;
    }>,
  ): Promise<CalendarEventEntity>;

  /**
   * Получить события календаря группы за период
   */
  getCalendarEventsByGroupId(
    props: DefaultProps<{
      userId: UUID;
      groupId: UUID;
      startDate: Date;
      endDate: Date;
      eventType?: import('@/entities').CalendarEventType;
    }>,
  ): Promise<CalendarEventEntity[]>;

  /**
   * Получить одно событие календаря
   */
  getCalendarEventById(
    props: DefaultProps<{
      userId: UUID;
      eventId: UUID;
    }>,
  ): Promise<CalendarEventEntity>;

  /**
   * Обновить событие календаря
   */
  updateCalendarEvent(
    props: DefaultProps<{
      userId: UUID;
      eventId: UUID;
      calendarEventPatchEntity: CalendarEventPatchEntity;
    }>,
  ): Promise<CalendarEventEntity>;

  /**
   * Удалить событие календаря
   */
  deleteCalendarEvent(
    props: DefaultProps<{
      userId: UUID;
      eventId: UUID;
      deleteMode: 'single' | 'all';
    }>,
  ): Promise<void>;
}
