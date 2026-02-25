import { UUID } from 'node:crypto';
import { CalendarEventEntity, CalendarEventCreateEntity, CalendarEventPatchEntity, GroupsUsersFindOneEntity } from '@/entities';
import { ICalendarEventsUseCases } from '@/domains/useCases';
import { ICalendarEventsService, IGroupsUsersService } from '@/domains/services';
import { ErrorCalendarEventNotExists, ErrorUserNotInGroup } from '@/pkg';
import { DefaultProps } from '@/domains/useCases';
import { ILogger } from '@/pkg/logger';

export class CalendarEventsUseCases implements ICalendarEventsUseCases {
  readonly #calendarEventsService: ICalendarEventsService;
  readonly #groupsUsersService: IGroupsUsersService;

  constructor(props: {
    calendarEventsService: ICalendarEventsService;
    groupsUsersService: IGroupsUsersService;
  }) {
    this.#calendarEventsService = props.calendarEventsService;
    this.#groupsUsersService = props.groupsUsersService;
  }

  async createCalendarEvent({
    userId,
    groupId,
    calendarEventCreateEntity,
    logger,
  }: DefaultProps<{
    userId: UUID;
    groupId: UUID;
    calendarEventCreateEntity: CalendarEventCreateEntity;
  }>): Promise<CalendarEventEntity> {
    // Проверяем что пользователь является участником группы
    await this.#checkUserInGroupOrThrow(userId, groupId, logger);

    logger?.debug({ userId, groupId, eventType: calendarEventCreateEntity.eventType }, 'Creating calendar event');

    const event = await this.#calendarEventsService.createEvent(calendarEventCreateEntity, { logger });

    logger?.debug({ eventId: event.id }, 'Calendar event created');

    return event;
  }

  async getCalendarEventsByGroupId({
    userId,
    groupId,
    startDate,
    endDate,
    logger,
  }: DefaultProps<{
    userId: UUID;
    groupId: UUID;
    startDate: Date;
    endDate: Date;
  }>): Promise<CalendarEventEntity[]> {
    // Проверяем что пользователь является участником группы
    await this.#checkUserInGroupOrThrow(userId, groupId, logger);

    logger?.debug({ userId, groupId, startDate, endDate }, 'Getting calendar events for group');

    return this.#calendarEventsService.getEventsByGroupId(groupId, startDate, endDate, { logger });
  }

  async getCalendarEventById({
    userId,
    eventId,
    logger,
  }: DefaultProps<{
    userId: UUID;
    eventId: UUID;
  }>): Promise<CalendarEventEntity> {
    logger?.debug({ userId, eventId }, 'Getting calendar event by id');

    const event = await this.#calendarEventsService.getEventById(eventId, { logger });

    if (!event) {
      throw new ErrorCalendarEventNotExists();
    }

    // Проверяем что пользователь является участником группы
    await this.#checkUserInGroupOrThrow(userId, event.groupId, logger);

    return event;
  }

  async updateCalendarEvent({
    userId,
    eventId,
    calendarEventPatchEntity,
    logger,
  }: DefaultProps<{
    userId: UUID;
    eventId: UUID;
    calendarEventPatchEntity: CalendarEventPatchEntity;
  }>): Promise<CalendarEventEntity> {
    logger?.debug({ userId, eventId }, 'Updating calendar event');

    const event = await this.#calendarEventsService.getEventById(eventId, { logger });

    if (!event) {
      throw new ErrorCalendarEventNotExists();
    }

    // Проверяем что пользователь является участником группы
    await this.#checkUserInGroupOrThrow(userId, event.groupId, logger);

    const updatedEvent = await this.#calendarEventsService.updateEvent(eventId, calendarEventPatchEntity, { logger });

    logger?.debug({ eventId }, 'Calendar event updated');

    return updatedEvent;
  }

  async deleteCalendarEvent({
    userId,
    eventId,
    deleteMode,
    logger,
  }: DefaultProps<{
    userId: UUID;
    eventId: UUID;
    deleteMode: 'single' | 'all';
  }>): Promise<void> {
    logger?.debug({ userId, eventId, deleteMode }, 'Deleting calendar event');

    const event = await this.#calendarEventsService.getEventById(eventId, { logger });

    if (!event) {
      throw new ErrorCalendarEventNotExists();
    }

    // Проверяем что пользователь является участником группы
    await this.#checkUserInGroupOrThrow(userId, event.groupId, logger);

    await this.#calendarEventsService.deleteEvent(eventId, deleteMode, { logger });

    logger?.debug({ eventId }, 'Calendar event deleted');
  }

  /**
   * Проверяет что пользователь является участником группы
   */
  async #checkUserInGroupOrThrow(userId: UUID, groupId: UUID, logger?: ILogger): Promise<void> {
    const groupUser = await this.#groupsUsersService.findOne(
      new GroupsUsersFindOneEntity({
        groupId,
        userId,
      }),
      { logger },
    );

    if (!groupUser) {
      throw new ErrorUserNotInGroup();
    }
  }
}
