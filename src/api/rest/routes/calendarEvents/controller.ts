import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { ICalendarEventsUseCases } from '@/domains/useCases';
import { IAuthMiddleware } from '../../domains';
import { PREFIX, ROUTES } from './constants';
import { SCHEMAS } from './schemas';
import { CalendarEventCreateEntity, CalendarEventEntity, CalendarEventPatchOneEntity } from '@/entities';

export class CalendarEventsRoutesController {
  #fastify: FastifyInstance;
  #authMiddleware: IAuthMiddleware;
  #calendarEventsUseCases: ICalendarEventsUseCases;

  constructor(props: {
    fastify: FastifyInstance;
    authMiddleware: IAuthMiddleware;
    calendarEventsUseCases: ICalendarEventsUseCases;
  }) {
    this.#fastify = props.fastify;
    this.#authMiddleware = props.authMiddleware;
    this.#calendarEventsUseCases = props.calendarEventsUseCases;
  }

  register() {
    this.#fastify.register(
      (instance) => {
        const router = instance.withTypeProvider<ZodTypeProvider>();
        router.addHook('preHandler', this.#authMiddleware.authenticate);

        router.get(
          ROUTES.getList,
          {
            schema: SCHEMAS.getList,
          },
          async (request, reply) => {
            const calendarEvents = await this.#calendarEventsUseCases.getCalendarEventsByGroupId({
              userId: request.userId,
              groupId: request.params.groupId,
              eventType: request.query.eventType,
              startDate: request.query.startDate ? new Date(request.query.startDate) : undefined,
              endDate: request.query.endDate ? new Date(request.query.endDate) : undefined,
              logger: request.log,
            });

            reply.status(200).send(calendarEvents.map(this.#serializeCalendarEvent));
          },
        );

        router.get(
          ROUTES.get,
          {
            schema: SCHEMAS.get,
          },
          async (request, reply) => {
            const calendarEvent = await this.#calendarEventsUseCases.getCalendarEvent({
              userId: request.userId,
              groupId: request.params.groupId,
              calendarEventId: request.params.calendarEventId,
              logger: request.log,
            });

            reply.status(200).send(this.#serializeCalendarEvent(calendarEvent));
          },
        );

        router.post(
          ROUTES.create,
          {
            schema: SCHEMAS.create,
          },
          async (request, reply) => {
            const userId = request.userId;
            const groupId = request.params.groupId;

            const calendarEvent = await this.#calendarEventsUseCases.createCalendarEvent({
              userId,
              groupId,
              calendarEventCreateEntity: new CalendarEventCreateEntity({
                groupId,
                creatorUserId: userId,
                title: request.body.title,
                description: request.body.description,
                eventType: request.body.eventType,
                iterationType: request.body.iterationType,
                recurrencePattern: request.body.recurrencePattern,
                startDate: new Date(request.body.startDate),
                endDate: request.body.endDate ? new Date(request.body.endDate) : undefined,
              }),
              logger: request.log,
            });
            reply.status(201).send(this.#serializeCalendarEvent(calendarEvent));
          },
        );

        router.patch(
          ROUTES.patch,
          {
            schema: SCHEMAS.patch,
          },
          async (request, reply) => {
            const calendarEvent = await this.#calendarEventsUseCases.patchCalendarEvent({
              userId: request.userId,
              groupId: request.params.groupId,
              calendarEventId: request.params.calendarEventId,
              calendarEventPatchOneEntity: new CalendarEventPatchOneEntity({
                title: request.body.title,
                description: request.body.description,
              }),
              logger: request.log,
            });

            reply.status(200).send(this.#serializeCalendarEvent(calendarEvent));
          },
        );

        router.delete(
          ROUTES.delete,
          {
            schema: SCHEMAS.delete,
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
      },
      {
        prefix: PREFIX,
      },
    );
  }

  #serializeCalendarEvent(calendarEvent: CalendarEventEntity) {
    return {
      id: calendarEvent.id,
      title: calendarEvent.title,
      description: calendarEvent.description,
      type: calendarEvent.eventType ?? undefined,
      iterationType: calendarEvent.iterationType,
      startDate: calendarEvent.startDate,
      endDate: calendarEvent.endDate,
      recurrencePattern: calendarEvent.recurrencePattern,
      createdAt: calendarEvent.createdAt.toISOString(),
    };
  }
}
