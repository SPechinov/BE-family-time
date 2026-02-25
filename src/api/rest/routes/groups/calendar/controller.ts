import { FastifyInstance } from 'fastify';
import { IAuthMiddleware } from '@/api/rest/domains';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { PREFIX, ROUTES } from './constants';
import { ICalendarEventsUseCases } from '@/domains/useCases';
import { SCHEMAS } from './schemas';
import { CalendarEventCreateEntity, CalendarEventPatchEntity, RecurrencePattern } from '@/entities';
import { UUID } from 'node:crypto';

export class CalendarRoutesController {
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

        // GET /groups/:groupId/calendar/events
        router.get(
          ROUTES.getList,
          {
            schema: SCHEMAS.getList,
          },
          async (request, reply) => {
            const events = await this.#calendarEventsUseCases.getCalendarEventsByGroupId({
              userId: request.userId,
              groupId: request.params.groupId as UUID,
              startDate: new Date(request.query.startDate),
              endDate: new Date(request.query.endDate),
              logger: request.log,
            });

            reply.status(200).send(
              events.map((event) => this.#serializeEvent(event)),
            );
          },
        );

        // GET /groups/:groupId/calendar/events/:eventId
        router.get(
          ROUTES.get,
          {
            schema: SCHEMAS.get,
          },
          async (request, reply) => {
            const event = await this.#calendarEventsUseCases.getCalendarEventById({
              userId: request.userId,
              eventId: request.params.eventId as UUID,
              logger: request.log,
            });

            reply.status(200).send(this.#serializeEvent(event));
          },
        );

        // POST /groups/:groupId/calendar/events
        router.post(
          ROUTES.create,
          {
            schema: SCHEMAS.create,
          },
          async (request, reply) => {
            const recurrencePattern = request.body.recurrencePattern
              ? this.#buildRecurrencePattern(request.body.recurrencePattern)
              : undefined;

            const event = await this.#calendarEventsUseCases.createCalendarEvent({
              userId: request.userId,
              groupId: request.params.groupId as UUID,
              calendarEventCreateEntity: new CalendarEventCreateEntity({
                groupId: request.params.groupId as UUID,
                creatorUserId: request.userId,
                title: request.body.title,
                description: request.body.description,
                eventType: request.body.eventType,
                startDate: new Date(request.body.startDate),
                endDate: new Date(request.body.endDate),
                isAllDay: request.body.isAllDay,
                recurrencePattern,
              }),
              logger: request.log,
            });

            reply.status(201).send(this.#serializeEvent(event));
          },
        );

        // PATCH /groups/:groupId/calendar/events/:eventId
        router.patch(
          ROUTES.update,
          {
            schema: SCHEMAS.update,
          },
          async (request, reply) => {
            const patchData: CalendarEventPatchEntity = new CalendarEventPatchEntity({
              title: request.body.title,
              description: request.body.description,
              startDate: request.body.startDate ? new Date(request.body.startDate) : undefined,
              endDate: request.body.endDate ? new Date(request.body.endDate) : undefined,
              isAllDay: request.body.isAllDay,
            });

            const event = await this.#calendarEventsUseCases.updateCalendarEvent({
              userId: request.userId,
              eventId: request.params.eventId as UUID,
              calendarEventPatchEntity: patchData,
              logger: request.log,
            });

            reply.status(200).send(this.#serializeEvent(event));
          },
        );

        // DELETE /groups/:groupId/calendar/events/:eventId
        router.delete(
          ROUTES.delete,
          {
            schema: SCHEMAS.delete,
          },
          async (request, reply) => {
            await this.#calendarEventsUseCases.deleteCalendarEvent({
              userId: request.userId,
              eventId: request.params.eventId as UUID,
              deleteMode: request.query.deleteMode,
              logger: request.log,
            });

            reply.status(200).send({});
          },
        );
      },
      {
        prefix: PREFIX,
      },
    );
  }

  #serializeEvent(event: import('@/entities').CalendarEventEntity) {
    return {
      id: event.id,
      groupId: event.groupId,
      creatorUserId: event.creatorUserId,
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      isAllDay: event.isAllDay,
      recurrencePattern: event.recurrencePattern,
      parentEventId: event.parentEventId ?? null,
      isException: event.isException,
      exceptionDate: event.exceptionDate ? event.exceptionDate.toISOString().split('T')[0] : null,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }

  #buildRecurrencePattern(pattern: any): RecurrencePattern {
    switch (pattern.type) {
      case 'weekly':
        return { type: 'weekly', weekdays: pattern.weekdays };
      case 'monthly':
        return { type: 'monthly', dayOfMonth: pattern.dayOfMonth };
      case 'work-schedule':
        return {
          type: 'work-schedule',
          shiftPattern: pattern.shiftPattern,
          startDate: pattern.startDate,
          shiftDuration: pattern.shiftDuration || 1,
        };
      default:
        return undefined as any;
    }
  }
}
