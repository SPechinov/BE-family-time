import { CalendarEventCreateEntity, CalendarEventEntity, GroupId, UserId } from '@/entities';
import { DefaultProps } from '../types';

export interface ICreateCalendarEventUseCase {
  execute(
    props: DefaultProps<{
      userId: UserId;
      groupId: GroupId;
      calendarEventCreateEntity: CalendarEventCreateEntity;
    }>,
  ): Promise<CalendarEventEntity>;
}
