import { CalendarEventEntity, CalendarEventCreateEntity, CalendarEventPatchEntity } from '@/entities';
import { PoolClient } from 'pg';
import { ILogger } from '@/pkg/logger';
import { UUID } from 'node:crypto';

export interface ICalendarEventsService {
  /**
   * Создать новое событие в календаре
   */
  createEvent(
    entity: CalendarEventCreateEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity>;

  /**
   * Получить события группы за период
   * Включает генерацию вхождений для recurring событий и применение исключений
   */
  getEventsByGroupId(
    groupId: UUID,
    startDate: Date,
    endDate: Date,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity[]>;

  /**
   * Получить одно событие по ID
   */
  getEventById(id: UUID, options?: { client?: PoolClient; logger?: ILogger }): Promise<CalendarEventEntity | null>;

  /**
   * Обновить событие
   */
  updateEvent(
    id: UUID,
    patchData: CalendarEventPatchEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity>;

  /**
   * Удалить событие
   * @param deleteMode — 'single' для одного вхождения, 'all' для всей серии
   */
  deleteEvent(
    id: UUID,
    deleteMode: 'single' | 'all',
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<void>;
}
