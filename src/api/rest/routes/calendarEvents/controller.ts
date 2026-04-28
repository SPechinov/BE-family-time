import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ICalendarEventsUseCases } from '@/domains/useCases';
import { PREFIX, ROUTES } from './constants';
import { SCHEMAS } from './schemas';
import {
  toCalendarEventResponse,
  toGetCalendarEventsListFilters,
  toGetCalendarEventsListResponse,
  toCreateCalendarEventCommand,
  toPatchCalendarEventCommand,
} from '@/api/rest/mappers';

type ZodRouter = FastifyInstance<any, any, any, any, ZodTypeProvider>;

export class CalendarEventsRoutesController {
  #fastify: FastifyInstance;
  #calendarEventsUseCases: ICalendarEventsUseCases;

  constructor(props: { fastify: FastifyInstance; calendarEventsUseCases: ICalendarEventsUseCases }) {
    this.#fastify = props.fastify;
    this.#calendarEventsUseCases = props.calendarEventsUseCases;
  }

  register() {
    this.#fastify.register(
      (instance) => {
        const router = instance.withTypeProvider<ZodTypeProvider>();

        this.#registerGetList(router);
        this.#registerGet(router);
        this.#registerCreate(router);
        this.#registerPatch(router);
        this.#registerDelete(router);
      },
      {
        prefix: PREFIX,
      },
    );
  }

  #registerGetList(router: ZodRouter): void {
    router.get(
      ROUTES.getList,
      {
        schema: SCHEMAS.getList,
        preHandler: [router.authenticate],
      },
      async (request, reply) => {
        const listFilters = toGetCalendarEventsListFilters({ query: request.query });
        const calendarEvents = await this.#calendarEventsUseCases.getCalendarEventsByGroupId({
          userId: request.userId,
          groupId: request.params.groupId,
          eventType: listFilters.eventType,
          startDate: listFilters.startDate,
          endDate: listFilters.endDate,
          logger: request.log,
        });

        reply.status(200).send(toGetCalendarEventsListResponse(calendarEvents));
      },
    );
  }

  #registerGet(router: ZodRouter): void {
    router.get(
      ROUTES.get,
      {
        schema: SCHEMAS.get,
        preHandler: [router.authenticate],
      },
      async (request, reply) => {
        const calendarEvent = await this.#calendarEventsUseCases.getCalendarEvent({
          userId: request.userId,
          groupId: request.params.groupId,
          calendarEventId: request.params.calendarEventId,
          logger: request.log,
        });

        reply.status(200).send(toCalendarEventResponse(calendarEvent));
      },
    );
  }

  #registerCreate(router: ZodRouter): void {
    router.post(
      ROUTES.create,
      {
        schema: SCHEMAS.create,
        preHandler: [router.authenticate],
      },
      async (request, reply) => {
        const userId = request.userId;
        const groupId = request.params.groupId;

        const calendarEvent = await this.#calendarEventsUseCases.createCalendarEvent({
          userId,
          groupId,
          calendarEventCreateEntity: toCreateCalendarEventCommand({
            userId,
            groupId,
            body: request.body,
          }),
          logger: request.log,
        });
        reply.status(201).send(toCalendarEventResponse(calendarEvent));
      },
    );
  }

  #registerPatch(router: ZodRouter): void {
    router.patch(
      ROUTES.patch,
      {
        schema: SCHEMAS.patch,
        preHandler: [router.authenticate],
      },
      async (request, reply) => {
        const calendarEvent = await this.#calendarEventsUseCases.patchCalendarEvent({
          userId: request.userId,
          groupId: request.params.groupId,
          calendarEventId: request.params.calendarEventId,
          calendarEventPatchOneEntity: toPatchCalendarEventCommand({ body: request.body }),
          logger: request.log,
        });

        reply.status(200).send(toCalendarEventResponse(calendarEvent));
      },
    );
  }

  #registerDelete(router: ZodRouter): void {
    router.delete(
      ROUTES.delete,
      {
        schema: SCHEMAS.delete,
        preHandler: [router.authenticate],
      },
      async (request, reply) => {
        await this.#calendarEventsUseCases.deleteCalendarEvent({
          userId: request.userId,
          groupId: request.params.groupId,
          calendarEventId: request.params.calendarEventId,
          logger: request.log,
        });

        reply.status(200).send();
      },
    );
  }
}
