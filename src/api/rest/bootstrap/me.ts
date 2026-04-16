import { FastifyInstance } from 'fastify';
import { MeRoutesController } from '@/api/rest/routes/me';
import { MeUseCases } from '@/useCases';
import { IUsersService } from '@/domains/services';

export const registerMeRoutes = (props: { instance: FastifyInstance; usersService: IUsersService }) => {
  const meUseCases = new MeUseCases({ usersService: props.usersService });

  new MeRoutesController({
    fastify: props.instance,
    meUseCases,
  }).register();
};
