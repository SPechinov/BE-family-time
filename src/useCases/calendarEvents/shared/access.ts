import { ICalendarEventsService, IGroupsUsersService } from '@/domains/services';
import { CalendarEventEntity, CalendarEventFindOneEntity, GroupId, GroupsUsersFindOneEntity, UserId } from '@/entities';
import { ErrorCalendarEventNotExists, ErrorGroupNotExists } from '@/pkg';
import { CalendarEventsOptions } from './types';

export class CalendarEventsAccess {
  readonly #calendarEventsService: ICalendarEventsService;
  readonly #groupsUsersService: IGroupsUsersService;

  constructor(props: { calendarEventsService: ICalendarEventsService; groupsUsersService: IGroupsUsersService }) {
    this.#calendarEventsService = props.calendarEventsService;
    this.#groupsUsersService = props.groupsUsersService;
  }

  async checkUserInGroupOrThrow(userId: UserId, groupId: GroupId, options: CalendarEventsOptions): Promise<void> {
    const groupUser = await this.#groupsUsersService.findOne(new GroupsUsersFindOneEntity({ groupId, userId }), options);
    if (!groupUser) throw new ErrorGroupNotExists();
  }

  async findOneCalendarEventOrThrow(
    calendarEventFindOneEntity: CalendarEventFindOneEntity,
    options: CalendarEventsOptions,
  ): Promise<CalendarEventEntity> {
    const event = await this.#calendarEventsService.findOne(calendarEventFindOneEntity, options);
    if (!event) throw new ErrorCalendarEventNotExists();
    return event;
  }
}
