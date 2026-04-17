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

export const toCalendarEventsResponse = (calendarEvents: CalendarEventEntity[]) =>
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

export const toPatchCalendarEventCommand = (body: { title?: string | null; description?: string | null }) =>
  new CalendarEventPatchOneEntity({
    title: body.title,
    description: body.description,
  });

export const toCalendarEventsListFilters = (query: {
  eventType?: CalendarEventType;
  startDate?: Date;
  endDate?: Date;
}) => ({
  eventType: query.eventType,
  startDate: query.startDate,
  endDate: query.endDate,
});
