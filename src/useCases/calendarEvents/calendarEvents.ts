import { ICalendarEventsService, IGroupsUsersService } from '@/domains/services';
import { DefaultProps, ICalendarEventsUseCases } from '@/domains/useCases';
import {
  CalendarEventCreateEntity,
  CalendarEventEntity,
  CalendarEventFindOneEntity,
  CalendarEventId,
  CalendarEventPatchOneEntity,
  CalendarEventType,
  GroupId,
  GroupsUsersFindOneEntity,
  UserId,
} from '@/entities';
import { ErrorCalendarEventNotExists, ErrorGroupNotExists, ILogger } from '@/pkg';

export class CalendarEventsUseCases implements ICalendarEventsUseCases {
  readonly #calendarEventsService: ICalendarEventsService;
  readonly #groupsUsersService: IGroupsUsersService;

  constructor(props: { calendarEventsService: ICalendarEventsService; groupsUsersService: IGroupsUsersService }) {
    this.#calendarEventsService = props.calendarEventsService;
    this.#groupsUsersService = props.groupsUsersService;
  }

  async createCalendarEvent({
    userId,
    groupId,
    calendarEventCreateEntity,
    logger,
  }: DefaultProps<{
    userId: UserId;
    groupId: GroupId;
    calendarEventCreateEntity: CalendarEventCreateEntity;
  }>): Promise<CalendarEventEntity> {
    const options = { logger };
    await this.#checkUserInGroupOrThrow(userId, groupId, options);
    return await this.#calendarEventsService.createOne(calendarEventCreateEntity, options);
  }

  async getCalendarEventsByGroupId({
    userId,
    groupId,
    startDate,
    endDate,
    logger,
  }: DefaultProps<{
    userId: UserId;
    groupId: GroupId;
    startDate?: Date;
    endDate?: Date;
    eventType?: CalendarEventType;
  }>): Promise<CalendarEventEntity[]> {
    const options = { logger };
    await this.#checkUserInGroupOrThrow(userId, groupId, options);

    return this.#calendarEventsService.getEventsByGroupId(groupId, startDate, endDate, options);
  }

  async getCalendarEventById({
    userId,
    groupId,
    eventId,
    logger,
  }: DefaultProps<{
    userId: UserId;
    groupId: GroupId;
    eventId: CalendarEventId;
  }>): Promise<CalendarEventEntity> {
    const options = { logger };
    await this.#checkUserInGroupOrThrow(userId, groupId, options);

    const event = await this.#calendarEventsService.findOne(new CalendarEventFindOneEntity({ id: eventId }), options);

    if (!event) {
      throw new ErrorCalendarEventNotExists();
    }

    return event;
  }

  async patchCalendarEvent({
    userId,
    groupId,
    eventId,
    calendarEventPatchOneEntity,
    logger,
  }: DefaultProps<{
    userId: UserId;
    groupId: GroupId;
    eventId: CalendarEventId;
    calendarEventPatchOneEntity: CalendarEventPatchOneEntity;
  }>): Promise<CalendarEventEntity> {
    const options = { logger };
    await this.#checkUserInGroupOrThrow(userId, groupId, options);
    const calendarEventFindOneEntity = new CalendarEventFindOneEntity({ id: eventId });

    const event = await this.#calendarEventsService.findOne(calendarEventFindOneEntity, options);

    if (!event) {
      throw new ErrorCalendarEventNotExists();
    }

    return await this.#calendarEventsService.patchOne(
      {
        calendarEventFindOneEntity,
        calendarEventPatchOneEntity,
      },
      options,
    );
  }

  async deleteCalendarEvent({
    userId,
    groupId,
    eventId,
    logger,
  }: DefaultProps<{
    userId: UserId;
    groupId: GroupId;
    eventId: CalendarEventId;
  }>): Promise<void> {
    const options = { logger };
    await this.#checkUserInGroupOrThrow(userId, groupId, options);
    const calendarEventFindOneEntity = new CalendarEventFindOneEntity({ id: eventId });

    const event = await this.#calendarEventsService.findOne(calendarEventFindOneEntity, options);

    if (!event) {
      throw new ErrorCalendarEventNotExists();
    }

    await this.#calendarEventsService.deleteOne(calendarEventFindOneEntity, options);
  }

  async #checkUserInGroupOrThrow(userId: UserId, groupId: GroupId, options?: { logger: ILogger }): Promise<void> {
    const groupUser = await this.#groupsUsersService.findOne(
      new GroupsUsersFindOneEntity({
        groupId,
        userId,
      }),
      options,
    );

    if (!groupUser) {
      throw new ErrorGroupNotExists();
    }
  }
}
