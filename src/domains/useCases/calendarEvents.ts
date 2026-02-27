import { DefaultProps } from './types';
import {
  CalendarEventCreateEntity,
  CalendarEventEntity,
  CalendarEventId,
  CalendarEventPatchEntity,
  CalendarEventType,
  GroupId,
  UserId,
} from '@/entities';

export interface ICalendarEventsUseCases {
  createCalendarEvent({
    userId,
    groupId,
    calendarEventCreateEntity,
    logger,
  }: DefaultProps<{
    userId: UserId;
    groupId: GroupId;
    calendarEventCreateEntity: CalendarEventCreateEntity;
  }>): Promise<CalendarEventEntity>;

  getCalendarEventsByGroupId({
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
  }>): Promise<CalendarEventEntity[]>;

  getCalendarEventById({
    userId,
    groupId,
    calendarEventId,
    logger,
  }: DefaultProps<{
    userId: UserId;
    groupId: GroupId;
    calendarEventId: CalendarEventId;
  }>): Promise<CalendarEventEntity>;

  patchCalendarEvent({
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
  }>): Promise<CalendarEventEntity>;

  deleteCalendarEvent({
    userId,
    groupId,
    calendarEventId,
    logger,
  }: DefaultProps<{
    userId: UserId;
    groupId: GroupId;
    calendarEventId: CalendarEventId;
  }>): Promise<void>;
}
