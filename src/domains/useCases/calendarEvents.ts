import { UUID } from 'node:crypto';
import { EventEntity, EventCreateEntity, CalendarEventPatchEntity } from '@/entities';
import { DefaultProps } from './types';

export interface ICalendarEventsUseCases {
  /**
   * Создать событие в календаре группы
   */
  createCalendarEvent(
    props: DefaultProps<{
      userId: UUID;
      groupId: UUID;
      calendarEventCreateEntity: EventCreateEntity;
    }>,
  ): Promise<EventEntity>;

  /**
   * Получить события календаря группы за период
   */
  getCalendarEventsByGroupId(
    props: DefaultProps<{
      userId: UUID;
      groupId: UUID;
      startDate: Date;
      endDate: Date;
      eventType?: import('@/entities').EventType;
    }>,
  ): Promise<EventEntity[]>;

  /**
   * Получить одно событие календаря
   */
  getCalendarEventById(
    props: DefaultProps<{
      userId: UUID;
      eventId: UUID;
    }>,
  ): Promise<EventEntity>;

  /**
   * Обновить событие календаря
   */
  updateCalendarEvent(
    props: DefaultProps<{
      userId: UUID;
      eventId: UUID;
      calendarEventPatchEntity: CalendarEventPatchEntity;
    }>,
  ): Promise<EventEntity>;

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
