import { ICreateCalendarEventUseCase } from './createCalendarEvent';
import { IDeleteCalendarEventUseCase } from './deleteCalendarEvent';
import { IGetCalendarEventUseCase } from './getCalendarEvent';
import { IListCalendarEventsUseCase } from './listCalendarEvents';
import { IPatchCalendarEventUseCase } from './patchCalendarEvent';

// Transitional aggregate contract for compatibility with existing controller/bootstrap wiring.
export interface ICalendarEventsUseCases {
  createCalendarEvent(...args: Parameters<ICreateCalendarEventUseCase['execute']>): ReturnType<ICreateCalendarEventUseCase['execute']>;
  getCalendarEventsByGroupId(...args: Parameters<IListCalendarEventsUseCase['execute']>): ReturnType<IListCalendarEventsUseCase['execute']>;
  getCalendarEvent(...args: Parameters<IGetCalendarEventUseCase['execute']>): ReturnType<IGetCalendarEventUseCase['execute']>;
  patchCalendarEvent(...args: Parameters<IPatchCalendarEventUseCase['execute']>): ReturnType<IPatchCalendarEventUseCase['execute']>;
  deleteCalendarEvent(...args: Parameters<IDeleteCalendarEventUseCase['execute']>): ReturnType<IDeleteCalendarEventUseCase['execute']>;
}
