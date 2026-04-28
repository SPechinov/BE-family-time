import {
  ICalendarEventsUseCases,
  ICreateCalendarEventUseCase,
  IDeleteCalendarEventUseCase,
  IGetCalendarEventUseCase,
  IListCalendarEventsUseCase,
  IPatchCalendarEventUseCase,
} from '@/domains/useCases';
import { CalendarEventsUseCasesDeps } from './shared/types';
import { CreateCalendarEventUseCase } from './createCalendarEvent';
import { DeleteCalendarEventUseCase } from './deleteCalendarEvent';
import { GetCalendarEventUseCase } from './getCalendarEvent';
import { ListCalendarEventsUseCase } from './listCalendarEvents';
import { PatchCalendarEventUseCase } from './patchCalendarEvent';

// Transitional aggregate adapter for compatibility with current controller/bootstrap wiring.
export class CalendarEventsUseCases implements ICalendarEventsUseCases {
  readonly #listCalendarEventsUseCase: IListCalendarEventsUseCase;
  readonly #getCalendarEventUseCase: IGetCalendarEventUseCase;
  readonly #createCalendarEventUseCase: ICreateCalendarEventUseCase;
  readonly #patchCalendarEventUseCase: IPatchCalendarEventUseCase;
  readonly #deleteCalendarEventUseCase: IDeleteCalendarEventUseCase;

  constructor(props: CalendarEventsUseCasesDeps) {
    this.#listCalendarEventsUseCase = new ListCalendarEventsUseCase(props);
    this.#getCalendarEventUseCase = new GetCalendarEventUseCase(props);
    this.#createCalendarEventUseCase = new CreateCalendarEventUseCase(props);
    this.#patchCalendarEventUseCase = new PatchCalendarEventUseCase(props);
    this.#deleteCalendarEventUseCase = new DeleteCalendarEventUseCase(props);
  }

  getCalendarEventsByGroupId(...args: Parameters<ICalendarEventsUseCases['getCalendarEventsByGroupId']>) {
    return this.#listCalendarEventsUseCase.execute(...args);
  }

  getCalendarEvent(...args: Parameters<ICalendarEventsUseCases['getCalendarEvent']>) {
    return this.#getCalendarEventUseCase.execute(...args);
  }

  createCalendarEvent(...args: Parameters<ICalendarEventsUseCases['createCalendarEvent']>) {
    return this.#createCalendarEventUseCase.execute(...args);
  }

  patchCalendarEvent(...args: Parameters<ICalendarEventsUseCases['patchCalendarEvent']>) {
    return this.#patchCalendarEventUseCase.execute(...args);
  }

  deleteCalendarEvent(...args: Parameters<ICalendarEventsUseCases['deleteCalendarEvent']>) {
    return this.#deleteCalendarEventUseCase.execute(...args);
  }
}
