import { CalendarEventEntity, CalendarEventId, CalendarEventPatchOneEntity, GroupId, UserId } from '@/entities';
import { DefaultProps } from '../types';

export interface IPatchCalendarEventUseCase {
  execute(
    props: DefaultProps<{
      userId: UserId;
      groupId: GroupId;
      calendarEventId: CalendarEventId;
      calendarEventPatchOneEntity: CalendarEventPatchOneEntity;
    }>,
  ): Promise<CalendarEventEntity>;
}
