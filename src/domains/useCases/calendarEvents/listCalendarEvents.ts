import { CalendarEventEntity, CalendarEventType, GroupId, UserId } from '@/entities';
import { DefaultProps } from '../types';

export interface IListCalendarEventsUseCase {
  execute(
    props: DefaultProps<{
      userId: UserId;
      groupId: GroupId;
      startDate?: Date;
      endDate?: Date;
      eventType?: CalendarEventType;
    }>,
  ): Promise<CalendarEventEntity[]>;
}
