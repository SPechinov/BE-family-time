import { ICalendarEventsService, IGroupsUsersService, IUsersService } from '@/domains/services';
import { DefaultProps, ICalendarEventsUseCases } from '@/domains/useCases';
import {
  CalendarEventCreateEntity,
  CalendarEventEntity,
  CalendarEventFindManyEntity,
  CalendarEventFindOneEntity,
  CalendarEventId,
  CalendarEventIterationType,
  CalendarEventPatchOneEntity,
  CalendarEventRecurrencePattern,
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
    try {
      this.#validateRecurrencePatternOrThrow(
        calendarEventCreateEntity.iterationType,
        calendarEventCreateEntity.recurrencePattern,
      );
      this.#validateDateRangeOrThrow(calendarEventCreateEntity.startDate, calendarEventCreateEntity.endDate);
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(error.message);
      }
      throw error;
    }

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

    return this.#findOneCalendarEventOrThrow(new CalendarEventFindOneEntity({ id: calendarEventId, groupId }), options);
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
    try {
      if (calendarEventPatchOneEntity.iterationType) {
        this.#validateRecurrencePatternOrThrow(
          calendarEventPatchOneEntity.iterationType,
          calendarEventPatchOneEntity.recurrencePattern,
        );
      }

      if (calendarEventPatchOneEntity.startDate && calendarEventPatchOneEntity.endDate) {
        this.#validateDateRangeOrThrow(calendarEventPatchOneEntity.startDate, calendarEventPatchOneEntity.endDate);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        logger.error(error.message);
      }
      throw error;
    }

    await this.#usersService.findOneByUserIdOrThrow(userId, options);
    await this.#checkUserInGroupOrThrow(userId, groupId, options);

    const calendarEventFindOneEntity = new CalendarEventFindOneEntity({ id: calendarEventId, groupId });

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

    const calendarEventFindOneEntity = new CalendarEventFindOneEntity({ id: calendarEventId, groupId });
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

  #validateRecurrencePatternOrThrow(
    iterationType: CalendarEventIterationType,
    recurrencePattern?: CalendarEventRecurrencePattern | null,
  ): void {
    if (iterationType === 'oneTime' || iterationType === 'yearly') {
      if (recurrencePattern) {
        throw new Error(`recurrencePattern must not be set for iterationType '${iterationType}'`);
      }
      return;
    }

    if (!recurrencePattern) {
      throw new Error(`recurrencePattern is required for iterationType '${iterationType}'`);
    }

    if (iterationType === 'weekly') {
      if (recurrencePattern.type !== 'weekly') {
        throw new Error(`recurrencePattern.type must be 'weekly' for iterationType 'weekly'`);
      }
      if (recurrencePattern.dayOfWeek < 0 || recurrencePattern.dayOfWeek > 6) {
        throw new Error('recurrencePattern.dayOfWeek must be between 0 and 6');
      }
    }

    if (iterationType === 'monthly') {
      if (recurrencePattern.type !== 'monthly') {
        throw new Error(`recurrencePattern.type must be 'monthly' for iterationType 'monthly'`);
      }
      if (recurrencePattern.dayOfMonth < 1 || recurrencePattern.dayOfMonth > 31) {
        throw new Error('recurrencePattern.dayOfMonth must be between 1 and 31');
      }
    }
  }

  #validateDateRangeOrThrow(startDate: Date, endDate?: Date | null): void {
    if (endDate !== null && endDate !== undefined && endDate < startDate) {
      throw new Error('endDate must be greater than or equal to startDate');
    }
  }
}
