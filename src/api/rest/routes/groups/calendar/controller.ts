import { FastifyInstance } from 'fastify';
import { IAuthMiddleware } from '@/api/rest/domains';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { PREFIX, ROUTES } from './constants';
import { ICalendarEventsUseCases } from '@/domains/useCases';
import { SCHEMAS } from './schemas';
import {
  CalendarEventCreateEntity,
  CalendarEventEntity,
  CalendarEventPatchEntity,
  CalendarEventRecurrencePattern,
} from '@/entities';
import { UUID } from 'node:crypto';

export class CalendarRoutesController {
  #fastify: FastifyInstance;
  #authMiddleware: IAuthMiddleware;
  #calendarEventUseCases: ICalendarEventsUseCases;

  constructor(props: {
    fastify: FastifyInstance;
    authMiddleware: IAuthMiddleware;
    calendarEventUseCases: ICalendarEventsUseCases;
  }) {
    this.#fastify = props.fastify;
    this.#authMiddleware = props.authMiddleware;
    this.#calendarEventUseCases = props.calendarEventUseCases;
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
            const calendarEvents = await this.#calendarEventUseCases.getCalendarEventsByGroupId({
              userId: request.userId,
              groupId: request.params.groupId as UUID,
              startDate: new Date(request.query.startDate),
              endDate: new Date(request.query.endDate),
              eventType: request.query.eventType,
              logger: request.log,
            });

            reply.status(200).send(calendarEvents.map((event) => this.#serializeEvent(event)));
          },
        );

        // GET /groups/:groupId/calendar/events/:eventId
        router.get(
          ROUTES.get,
          {
            schema: SCHEMAS.get,
          },
          async (request, reply) => {
            const calendarEvent = await this.#calendarEventUseCases.getCalendarEventById({
              userId: request.userId,
              groupId: request.params.groupId as UUID,
              calendarEventId: request.params.eventId as UUID,
              logger: request.log,
            });

            reply.status(200).send(this.#serializeEvent(calendarEvent));
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

            const calendarEvent = await this.#calendarEventUseCases.createCalendarEvent({
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
                isAllDay: request.body.isAllDay ?? false,
                recurrencePattern,
              }),
              logger: request.log,
            });

            reply.status(201).send(this.#serializeEvent(calendarEvent));
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
              eventType: request.body.eventType,
              startDate: request.body.startDate ? new Date(request.body.startDate) : undefined,
              endDate: request.body.endDate ? new Date(request.body.endDate) : undefined,
              isAllDay: request.body.isAllDay,
              recurrencePattern: request.body.recurrencePattern
                ? this.#buildRecurrencePattern(request.body.recurrencePattern)
                : null,
            });

            const calendarEvent = await this.#calendarEventUseCases.patchCalendarEvent({
              userId: request.userId,
              groupId: request.params.groupId as UUID,
              calendarEventId: request.params.eventId as UUID,
              calendarEventPatchOneEntity: patchData,
              logger: request.log,
            });

            reply.status(200).send(this.#serializeEvent(calendarEvent));
          },
        );

        // DELETE /groups/:groupId/calendar/events/:eventId
        router.delete(
          ROUTES.delete,
          {
            schema: SCHEMAS.delete,
          },
          async (request, reply) => {
            await this.#calendarEventUseCases.deleteCalendarEvent({
              userId: request.userId,
              groupId: request.params.groupId as UUID,
              calendarEventId: request.params.eventId as UUID,
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

  #serializeEvent(calendarEvent: CalendarEventEntity) {
    return {
      id: calendarEvent.id,
      groupId: calendarEvent.groupId,
      creatorUserId: calendarEvent.creatorUserId,
      title: calendarEvent.title,
      description: calendarEvent.description,
      eventType: calendarEvent.eventType,
      startDate: calendarEvent.startDate.toISOString(),
      endDate: calendarEvent.endDate.toISOString(),
      isAllDay: calendarEvent.isAllDay,
      recurrencePattern: calendarEvent.recurrencePattern,
      parentEventId: calendarEvent.parentEventId ?? null,
      isException: calendarEvent.isException,
      exceptionDate: calendarEvent.exceptionDate ? calendarEvent.exceptionDate.toISOString().split('T')[0] : null,
      createdAt: calendarEvent.createdAt.toISOString(),
      updatedAt: calendarEvent.updatedAt.toISOString(),
    };
  }

  #buildRecurrencePattern(pattern: any): CalendarEventRecurrencePattern {
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
          shiftDuration: pattern.shiftDuration,
        };
      default:
        throw new Error(`Invalid recurrence pattern type: ${pattern.type}`);
    }
  }
}
