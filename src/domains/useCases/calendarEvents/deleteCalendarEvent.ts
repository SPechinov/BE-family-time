import { CalendarEventId, GroupId, UserId } from '@/entities';
import { DefaultProps } from '../types';

export interface IDeleteCalendarEventUseCase {
  execute(
    props: DefaultProps<{
      userId: UserId;
      groupId: GroupId;
      calendarEventId: CalendarEventId;
    }>,
  ): Promise<void>;
}
