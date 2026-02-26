import { DefaultProps } from './types';
import { EventCreateEntity, EventEntity, EventId, EventPatchOneEntity, EventType, GroupId, UserId } from '@/entities';

export interface IEventsUseCases {
  createEvent({
    userId,
    groupId,
    eventCreateEntity,
    logger,
  }: DefaultProps<{
    userId: UserId;
    groupId: GroupId;
    eventCreateEntity: EventCreateEntity;
  }>): Promise<EventEntity>;

  getEventsByGroupId({
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
  }>): Promise<EventEntity[]>;

  getEventById({
    userId,
    groupId,
    eventId,
    logger,
  }: DefaultProps<{
    userId: UserId;
    groupId: GroupId;
    eventId: EventId;
  }>): Promise<EventEntity>;

  patchEvent({
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
  }>): Promise<EventEntity>;

  deleteEvent({
    userId,
    groupId,
    eventId,
    logger,
  }: DefaultProps<{
    userId: UserId;
    groupId: GroupId;
    eventId: EventId;
  }>): Promise<void>;
}
