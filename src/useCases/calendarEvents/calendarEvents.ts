import { ICalendarEventsService, IGroupsUsersService, IUsersService } from '@/domains/services';
import { DefaultProps, ICalendarEventsUseCases } from '@/domains/useCases';
import {
  CalendarEventCreateEntity,
  CalendarEventEntity,
  CalendarEventFindManyEntity,
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
  readonly #usersService: IUsersService;
  readonly #calendarEventsService: ICalendarEventsService;
  readonly #groupsUsersService: IGroupsUsersService;

  constructor(props: {
    usersService: IUsersService;
    calendarEventsService: ICalendarEventsService;
    groupsUsersService: IGroupsUsersService;
  }) {
    this.#usersService = props.usersService;
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
    await this.#usersService.findOneByUserIdOrThrow(userId, options);
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
    await this.#usersService.findOneByUserIdOrThrow(userId, options);
    await this.#checkUserInGroupOrThrow(userId, groupId, options);

    return this.#calendarEventsService.findMany(
      new CalendarEventFindManyEntity({
        groupId,
        period: {
          startDate,
          endDate,
        },
      }),
    );
  }

  async getCalendarEvent({
    userId,
    groupId,
    calendarEventId,
    logger,
  }: DefaultProps<{
    userId: UserId;
    groupId: GroupId;
    calendarEventId: CalendarEventId;
  }>): Promise<CalendarEventEntity> {
    const options = { logger };
    await this.#usersService.findOneByUserIdOrThrow(userId, options);
    await this.#checkUserInGroupOrThrow(userId, groupId, options);

    return this.#findOneCalendarEventOrThrow(new CalendarEventFindOneEntity({ id: calendarEventId }), options);
  }

  async patchCalendarEvent({
    userId,
    groupId,
    calendarEventId,
    calendarEventPatchOneEntity,
    logger,
  }: DefaultProps<{
    userId: UserId;
    groupId: GroupId;
    calendarEventId: CalendarEventId;
    calendarEventPatchOneEntity: CalendarEventPatchOneEntity;
  }>): Promise<CalendarEventEntity> {
    const options = { logger };
    await this.#usersService.findOneByUserIdOrThrow(userId, options);
    await this.#checkUserInGroupOrThrow(userId, groupId, options);

    const calendarEventFindOneEntity = new CalendarEventFindOneEntity({ id: calendarEventId });

    await this.#findOneCalendarEventOrThrow(calendarEventFindOneEntity, options);
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
    calendarEventId,
    logger,
  }: DefaultProps<{
    userId: UserId;
    groupId: GroupId;
    calendarEventId: CalendarEventId;
  }>): Promise<void> {
    const options = { logger };
    await this.#usersService.findOneByUserIdOrThrow(userId, options);
    await this.#checkUserInGroupOrThrow(userId, groupId, options);

    const calendarEventFindOneEntity = new CalendarEventFindOneEntity({ id: calendarEventId });
    await this.#findOneCalendarEventOrThrow(calendarEventFindOneEntity, options);
    await this.#calendarEventsService.deleteOne(calendarEventFindOneEntity, options);
  }

  async #findOneCalendarEventOrThrow(
    calendarEventFindOneEntity: CalendarEventFindOneEntity,
    options?: { logger?: ILogger },
  ): Promise<CalendarEventEntity> {
    const event = await this.#calendarEventsService.findOne(calendarEventFindOneEntity, options);

    if (!event) {
      throw new ErrorCalendarEventNotExists();
    }

    return event;
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
