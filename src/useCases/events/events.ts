import { IEventsService, IGroupsUsersService } from '@/domains/services';
import { DefaultProps, IEventsUseCases } from '@/domains/useCases';
import {
  EventCreateEntity,
  EventEntity,
  EventFindOneEntity,
  EventId,
  EventPatchOneEntity,
  EventType,
  GroupId,
  GroupsUsersFindOneEntity,
  UserId,
} from '@/entities';
import { ErrorEventNotExists, ErrorGroupNotExists, ILogger } from '@/pkg';

export class EventsUseCases implements IEventsUseCases {
  readonly #eventsService: IEventsService;
  readonly #groupsUsersService: IGroupsUsersService;

  constructor(props: { eventsService: IEventsService; groupsUsersService: IGroupsUsersService }) {
    this.#eventsService = props.eventsService;
    this.#groupsUsersService = props.groupsUsersService;
  }

  async createEvent({
    userId,
    groupId,
    eventCreateEntity,
    logger,
  }: DefaultProps<{
    userId: UserId;
    groupId: GroupId;
    eventCreateEntity: EventCreateEntity;
  }>): Promise<EventEntity> {
    const options = { logger };
    await this.#checkUserInGroupOrThrow(userId, groupId, options);
    return await this.#eventsService.createOne(eventCreateEntity, options);
  }

  async getEventsByGroupId({
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
    eventType?: EventType;
  }>): Promise<EventEntity[]> {
    const options = { logger };
    await this.#checkUserInGroupOrThrow(userId, groupId, options);

    return this.#eventsService.getEventsByGroupId(groupId, startDate, endDate, options);
  }

  async getEventById({
    userId,
    groupId,
    eventId,
    logger,
  }: DefaultProps<{
    userId: UserId;
    groupId: GroupId;
    eventId: EventId;
  }>): Promise<EventEntity> {
    const options = { logger };
    await this.#checkUserInGroupOrThrow(userId, groupId, options);

    const event = await this.#eventsService.findOne(new EventFindOneEntity({ id: eventId }), options);

    if (!event) {
      throw new ErrorEventNotExists();
    }

    return event;
  }

  async patchEvent({
    userId,
    groupId,
    eventId,
    eventPatchOneEntity,
    logger,
  }: DefaultProps<{
    userId: UserId;
    groupId: GroupId;
    eventId: EventId;
    eventPatchOneEntity: EventPatchOneEntity;
  }>): Promise<EventEntity> {
    const options = { logger };
    await this.#checkUserInGroupOrThrow(userId, groupId, options);
    const eventFindOneEntity = new EventFindOneEntity({ id: eventId });

    const event = await this.#eventsService.findOne(eventFindOneEntity, options);

    if (!event) {
      throw new ErrorEventNotExists();
    }

    return await this.#eventsService.patchOne(
      {
        eventFindOneEntity: eventFindOneEntity,
        eventPatchOneEntity: eventPatchOneEntity,
      },
      options,
    );
  }

  async deleteEvent({
    userId,
    groupId,
    eventId,
    logger,
  }: DefaultProps<{
    userId: UserId;
    groupId: GroupId;
    eventId: EventId;
  }>): Promise<void> {
    const options = { logger };
    await this.#checkUserInGroupOrThrow(userId, groupId, options);
    const eventFindOneEntity = new EventFindOneEntity({ id: eventId });

    const event = await this.#eventsService.findOne(eventFindOneEntity, options);

    if (!event) {
      throw new ErrorEventNotExists();
    }

    await this.#eventsService.deleteOne(eventFindOneEntity, options);
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
