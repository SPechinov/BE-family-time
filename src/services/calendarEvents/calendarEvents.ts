import { ICalendarRepository } from '@/domains/repositories/db';
import { CalendarEventEntity, CalendarEventCreateEntity, CalendarEventPatchEntity } from '@/entities';
import { ICalendarEventsService } from '@/domains/services';
import { PoolClient } from 'pg';
import { ILogger } from '@/pkg/logger';
import { UUID } from 'node:crypto';

export class CalendarEventsService implements ICalendarEventsService {
  readonly #calendarEventsRepository: ICalendarRepository;

  constructor(props: { calendarEventsRepository: ICalendarRepository }) {
    this.#calendarEventsRepository = props.calendarEventsRepository;
  }

  async createEvent(
    entity: CalendarEventCreateEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity> {
    return this.#calendarEventsRepository.createOne(entity, options);
  }

  async getEventsByGroupId(
    groupId: UUID,
    startDate: Date,
    endDate: Date,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity[]> {
    const logger = options?.logger;

    // Получаем базовые события из БД
    const baseEvents = await this.#calendarEventsRepository.findForPeriod(groupId, startDate, endDate, options);

    // Получаем исключения за период
    const exceptions = await this.#calendarEventsRepository.findExceptions(groupId, startDate, endDate, options);

    logger?.debug(
      { baseEventsCount: baseEvents.length, exceptionsCount: exceptions.length },
      'CalendarEvents service: retrieved base events and exceptions',
    );

    // Генерируем вхождения для каждого события
    const allOccurrences: CalendarEventEntity[] = [];

    for (const event of baseEvents) {
      // Пропускаем исключения — они уже в развёрнутом виде
      if (event.isException) {
        allOccurrences.push(event);
        continue;
      }

      // Генерируем вхождения в зависимости от типа события
      const occurrences = this.#generateOccurrences(event, startDate, endDate);
      allOccurrences.push(...occurrences);
    }

    // Применяем исключения (удаляем отменённые вхождения)
    const result = this.#applyExceptions(allOccurrences, exceptions);

    logger?.debug({ resultCount: result.length }, 'CalendarEvents service: generated occurrences with exceptions');

    return result;
  }

  async getEventById(
    id: UUID,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity | null> {
    const entity = new (await import('@/entities')).CalendarEventFindOneEntity({ id });
    return this.#calendarEventsRepository.findOne(entity, options);
  }

  async updateEvent(
    id: UUID,
    patchData: CalendarEventPatchEntity,
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<CalendarEventEntity> {
    return this.#calendarEventsRepository.patchOne(id, patchData, options);
  }

  async deleteEvent(
    id: UUID,
    deleteMode: 'single' | 'all',
    options?: { client?: PoolClient; logger?: ILogger },
  ): Promise<void> {
    const entity = new (await import('@/entities')).CalendarEventFindOneEntity({ id });
    const event = await this.#calendarEventsRepository.findOne(entity, options);

    if (!event) {
      throw new Error('Calendar event not found');
    }

    // Если это исключение — просто удаляем его
    if (event.isException) {
      await this.#calendarEventsRepository.deleteOne(id, options);
      return;
    }

    // Если это recurring событие с deleteMode='single' — создаём исключение
    if (['weekly', 'monthly', 'work-schedule', 'yearly'].includes(event.eventType) && deleteMode === 'single') {
      // Для recurring событий создаём исключение
      const parentEventId = event.parentEventId ?? event.id;
      await this.#calendarEventsRepository.createException(
        {
          parentEventId,
          exceptionDate: event.startDate,
        },
        options,
      );
      return;
    }

    // Для deleteMode='all' удаляем всю серию
    if (deleteMode === 'all') {
      const parentEventId = event.parentEventId ?? event.id;
      await this.#calendarEventsRepository.deleteSeries(parentEventId, options);
      return;
    }

    // Для one-time событий просто удаляем
    await this.#calendarEventsRepository.deleteOne(id, options);
  }

  /**
   * Генерирует вхождения события для периода
   */
  #generateOccurrences(event: CalendarEventEntity, periodStart: Date, periodEnd: Date): CalendarEventEntity[] {
    switch (event.eventType) {
      case 'one-time':
        return this.#generateOneTime(event, periodStart, periodEnd);
      case 'yearly':
        return this.#generateYearly(event, periodStart, periodEnd);
      case 'weekly':
        return this.#generateWeekly(event, periodStart, periodEnd);
      case 'monthly':
        return this.#generateMonthly(event, periodStart, periodEnd);
      case 'work-schedule':
        return this.#generateWorkShifts(event, periodStart, periodEnd);
      default:
        return [];
    }
  }

  /**
   * One-time событие — просто проверяем попадание в период
   */
  #generateOneTime(event: CalendarEventEntity, periodStart: Date, periodEnd: Date): CalendarEventEntity[] {
    if (event.startDate >= periodStart && event.startDate <= periodEnd) {
      return [event];
    }
    return [];
  }

  /**
   * Yearly событие — генерируем вхождения каждый год
   */
  #generateYearly(event: CalendarEventEntity, periodStart: Date, periodEnd: Date): CalendarEventEntity[] {
    const occurrences: CalendarEventEntity[] = [];
    const eventMonth = event.startDate.getMonth(); // 0-11
    const eventDay = event.startDate.getDate(); // 1-31

    let currentYear = periodStart.getFullYear();
    while (currentYear <= periodEnd.getFullYear()) {
      const daysInMonth = new Date(currentYear, eventMonth + 1, 0).getDate();

      // Если день события больше чем дней в месяце (например, 31 февраля), пропускаем
      if (eventDay <= daysInMonth) {
        const occurrenceStart = new Date(currentYear, eventMonth, eventDay);
        occurrenceStart.setHours(
          event.startDate.getHours(),
          event.startDate.getMinutes(),
          event.startDate.getSeconds(),
        );

        const occurrenceEnd = new Date(currentYear, eventMonth, eventDay);
        occurrenceEnd.setHours(event.endDate.getHours(), event.endDate.getMinutes(), event.endDate.getSeconds());

        if (occurrenceStart >= periodStart && occurrenceStart <= periodEnd) {
          occurrences.push(
            new CalendarEventEntity({
              id: event.id,
              groupId: event.groupId,
              creatorUserId: event.creatorUserId,
              title: event.title,
              description: event.description,
              eventType: event.eventType,
              startDate: occurrenceStart,
              endDate: occurrenceEnd,
              isAllDay: event.isAllDay,
              recurrencePattern: event.recurrencePattern,
              parentEventId: event.parentEventId,
              isException: false,
              exceptionDate: undefined,
              createdAt: event.createdAt,
              updatedAt: event.updatedAt,
            }),
          );
        }
      }
      currentYear++;
    }

    return occurrences;
  }

  /**
   * Weekly событие — генерируем вхождения по дням недели
   */
  #generateWeekly(event: CalendarEventEntity, periodStart: Date, periodEnd: Date): CalendarEventEntity[] {
    const occurrences: CalendarEventEntity[] = [];
    const pattern = event.recurrencePattern as { type: 'weekly'; weekdays: number[] };
    const weekdays = pattern.weekdays; // 1=понедельник, 7=воскресенье

    let current = this.#startOfDay(periodStart);
    while (current <= periodEnd) {
      const dayOfWeek = current.getDay(); // 0=воскресенье, 1-6=понедельник-суббота
      // Конвертируем: 0 (Sun) -> 7, 1 (Mon) -> 1, etc.
      const jsDay = dayOfWeek === 0 ? 7 : dayOfWeek;

      if (weekdays.includes(jsDay)) {
        const occurrenceStart = new Date(current);
        occurrenceStart.setHours(
          event.startDate.getHours(),
          event.startDate.getMinutes(),
          event.startDate.getSeconds(),
        );

        const occurrenceEnd = new Date(current);
        occurrenceEnd.setHours(event.endDate.getHours(), event.endDate.getMinutes(), event.endDate.getSeconds());

        occurrences.push(
          new CalendarEventEntity({
            id: event.id,
            groupId: event.groupId,
            creatorUserId: event.creatorUserId,
            title: event.title,
            description: event.description,
            eventType: event.eventType,
            startDate: occurrenceStart,
            endDate: occurrenceEnd,
            isAllDay: event.isAllDay,
            recurrencePattern: event.recurrencePattern,
            parentEventId: event.parentEventId,
            isException: false,
            exceptionDate: undefined,
            createdAt: event.createdAt,
            updatedAt: event.updatedAt,
          }),
        );
      }

      current = this.#addDays(current, 1);
    }

    return occurrences;
  }

  /**
   * Monthly событие — генерируем вхождения каждый месяц
   */
  #generateMonthly(event: CalendarEventEntity, periodStart: Date, periodEnd: Date): CalendarEventEntity[] {
    const occurrences: CalendarEventEntity[] = [];
    const pattern = event.recurrencePattern as { type: 'monthly'; dayOfMonth: number };
    const dayOfMonth = pattern.dayOfMonth;

    let current = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1);
    while (current <= periodEnd) {
      const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();

      if (dayOfMonth <= daysInMonth) {
        const occurrenceStart = new Date(current.getFullYear(), current.getMonth(), dayOfMonth);
        occurrenceStart.setHours(
          event.startDate.getHours(),
          event.startDate.getMinutes(),
          event.startDate.getSeconds(),
        );

        const occurrenceEnd = new Date(current.getFullYear(), current.getMonth(), dayOfMonth);
        occurrenceEnd.setHours(event.endDate.getHours(), event.endDate.getMinutes(), event.endDate.getSeconds());

        if (occurrenceStart >= periodStart && occurrenceStart <= periodEnd) {
          occurrences.push(
            new CalendarEventEntity({
              id: event.id,
              groupId: event.groupId,
              creatorUserId: event.creatorUserId,
              title: event.title,
              description: event.description,
              eventType: event.eventType,
              startDate: occurrenceStart,
              endDate: occurrenceEnd,
              isAllDay: event.isAllDay,
              recurrencePattern: event.recurrencePattern,
              parentEventId: event.parentEventId,
              isException: false,
              exceptionDate: undefined,
              createdAt: event.createdAt,
              updatedAt: event.updatedAt,
            }),
          );
        }
      }

      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }

    return occurrences;
  }

  /**
   * Work-schedule событие — генерируем смены по паттерну
   */
  #generateWorkShifts(event: CalendarEventEntity, periodStart: Date, periodEnd: Date): CalendarEventEntity[] {
    const occurrences: CalendarEventEntity[] = [];
    const pattern = event.recurrencePattern as {
      type: 'work-schedule';
      shiftPattern: number[];
      startDate: string;
      shiftDuration: number;
    };

    const shiftPattern = pattern.shiftPattern; // [1,1,0,0] для 2/2
    const patternStartDate = new Date(pattern.startDate);
    const shiftDuration = pattern.shiftDuration || 1;
    const patternLength = shiftPattern.length;

    let current = this.#startOfDay(patternStartDate);
    let patternIndex = 0;

    // Находим первую смену в периоде
    while (current < periodStart) {
      patternIndex = (patternIndex + 1) % patternLength;
      current = this.#addDays(current, shiftDuration);
    }

    // Генерируем смены в периоде
    while (current <= periodEnd) {
      if (shiftPattern[patternIndex] === 1) {
        const occurrenceStart = this.#startOfDay(current);
        const occurrenceEnd = this.#endOfDay(current);

        occurrences.push(
          new CalendarEventEntity({
            id: event.id,
            groupId: event.groupId,
            creatorUserId: event.creatorUserId,
            title: event.title,
            description: event.description,
            eventType: event.eventType,
            startDate: occurrenceStart,
            endDate: occurrenceEnd,
            isAllDay: true,
            recurrencePattern: event.recurrencePattern,
            parentEventId: event.parentEventId,
            isException: false,
            exceptionDate: undefined,
            createdAt: event.createdAt,
            updatedAt: event.updatedAt,
          }),
        );
      }
      patternIndex = (patternIndex + 1) % patternLength;
      current = this.#addDays(current, shiftDuration);
    }

    return occurrences;
  }

  /**
   * Применяет исключения к вхождениям
   */
  #applyExceptions(occurrences: CalendarEventEntity[], exceptions: CalendarEventEntity[]): CalendarEventEntity[] {
    const exceptionDates = new Set(exceptions.map((e) => this.#formatDate(e.exceptionDate ?? e.startDate)));

    return occurrences.filter((occ) => !exceptionDates.has(this.#formatDate(occ.startDate)));
  }

  // Utility functions

  #startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  #endOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  #addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  #formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
