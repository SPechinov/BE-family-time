import {
  CalendarEventCreateEntity,
  CalendarEventEntity,
  CalendarEventRecurrencePattern,
  CalendarEventType,
  CalendarEventPatchOneEntity,
  CalendarEventIterationType,
  GroupId,
  UserId,
} from '@/entities';

export const toCalendarEventResponse = (calendarEvent: CalendarEventEntity) => {
  return {
    id: calendarEvent.id,
    title: calendarEvent.title,
    description: calendarEvent.description,
    eventType: calendarEvent.eventType ?? undefined,
    iterationType: calendarEvent.iterationType,
    startDate: calendarEvent.startDate.toISOString(),
    endDate: calendarEvent.endDate?.toISOString(),
    recurrencePattern: calendarEvent.recurrencePattern,
  };
};

export const toGetCalendarEventsListResponse = (calendarEvents: CalendarEventEntity[]) =>
  calendarEvents.map(toCalendarEventResponse);

export const toCreateCalendarEventCommand = (props: {
  userId: UserId;
  groupId: string;
  body: {
    title: string;
    description?: string;
    eventType?: CalendarEventType;
    iterationType: CalendarEventIterationType;
    recurrencePattern?: CalendarEventRecurrencePattern;
    startDate: Date;
    endDate?: Date;
  };
}) =>
  new CalendarEventCreateEntity({
    groupId: props.groupId as unknown as GroupId,
    creatorUserId: props.userId,
    title: props.body.title,
    description: props.body.description,
    eventType: props.body.eventType,
    iterationType: props.body.iterationType,
    recurrencePattern: props.body.recurrencePattern,
    startDate: props.body.startDate,
    endDate: props.body.endDate,
  });

export const toPatchCalendarEventCommand = (props: { body: { title?: string | null; description?: string | null } }) =>
  new CalendarEventPatchOneEntity({
    title: props.body.title,
    description: props.body.description,
  });

export const toGetCalendarEventsListFilters = (props: {
  query: {
    eventType?: CalendarEventType;
    startDate?: Date;
    endDate?: Date;
  };
}) => ({
  eventType: props.query.eventType,
  startDate: props.query.startDate,
  endDate: props.query.endDate,
});
