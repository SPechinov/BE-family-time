import { FastifyInstance } from 'fastify';
import { MeRoutesController } from '@/api/rest/routes/me';
import { GetMeUseCase, PatchMeProfileUseCase } from '@/useCases';
import { IUsersService } from '@/domains/services';

export const registerMeRoutes = (props: { instance: FastifyInstance; usersService: IUsersService }) => {
  const getMeUseCase = new GetMeUseCase({ usersService: props.usersService });
  const patchMeProfileUseCase = new PatchMeProfileUseCase({ usersService: props.usersService });

  new MeRoutesController({
    fastify: props.instance,
    getMeUseCase,
    patchMeProfileUseCase,
  }).register();
};
