import { ICalendarEventService, IGroupsUsersService } from '@/domains/services';
import { DefaultProps, ICalendarEventUseCases } from '@/domains/useCases';
import {
  CalendarEventCreateEntity,
  CalendarEventEntity,
  CalendarEventFindOneEntity,
  CalendarEventId,
  CalendarEventPatchEntity,
  CalendarEventType,
  GroupId,
  GroupsUsersFindOneEntity,
  UserId,
} from '@/entities';
import { ErrorEventNotExists, ErrorGroupNotExists, ILogger } from '@/pkg';

export class CalendarEventUseCases implements ICalendarEventUseCases {
  readonly #calendarEventService: ICalendarEventService;
  readonly #groupsUsersService: IGroupsUsersService;

  constructor(props: { calendarEventService: ICalendarEventService; groupsUsersService: IGroupsUsersService }) {
    this.#calendarEventService = props.calendarEventService;
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
    return await this.#calendarEventService.createOne(calendarEventCreateEntity, options);
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

    return this.#calendarEventService.getCalendarEventsByGroupId(groupId, startDate, endDate, options);
  }

  async getCalendarEventById({
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
    await this.#checkUserInGroupOrThrow(userId, groupId, options);

    const calendarEvent = await this.#calendarEventService.findOne(
      new CalendarEventFindOneEntity({ id: calendarEventId }),
      options,
    );

    if (!calendarEvent) {
      throw new ErrorEventNotExists();
    }

    return calendarEvent;
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
    calendarEventPatchOneEntity: CalendarEventPatchEntity;
  }>): Promise<CalendarEventEntity> {
    const options = { logger };
    await this.#checkUserInGroupOrThrow(userId, groupId, options);
    const calendarEventFindOneEntity = new CalendarEventFindOneEntity({ id: calendarEventId });

    const calendarEvent = await this.#calendarEventService.findOne(calendarEventFindOneEntity, options);

    if (!calendarEvent) {
      throw new ErrorEventNotExists();
    }

    return await this.#calendarEventService.patchOne(
      {
        calendarEventFindOneEntity: calendarEventFindOneEntity,
        calendarEventPatchOneEntity: calendarEventPatchOneEntity,
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
    await this.#checkUserInGroupOrThrow(userId, groupId, options);
    const calendarEventFindOneEntity = new CalendarEventFindOneEntity({ id: calendarEventId });

    const calendarEvent = await this.#calendarEventService.findOne(calendarEventFindOneEntity, options);

    if (!calendarEvent) {
      throw new ErrorEventNotExists();
    }

    await this.#calendarEventService.deleteOne(calendarEventFindOneEntity, options);
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
