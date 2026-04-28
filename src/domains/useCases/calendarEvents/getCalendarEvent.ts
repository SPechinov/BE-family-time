import { CalendarEventEntity, CalendarEventId, GroupId, UserId } from '@/entities';
import { DefaultProps } from '../types';

export interface IGetCalendarEventUseCase {
  execute(
    props: DefaultProps<{
      userId: UserId;
      groupId: GroupId;
      calendarEventId: CalendarEventId;
    }>,
  ): Promise<CalendarEventEntity>;
}
