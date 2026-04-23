import { FastifyInstance } from 'fastify';
import { MeRoutesController } from '@/api/rest/routes/me';
import { GetMeUseCase, PatchMeProfileUseCase } from '@/useCases';
import { IUsersService } from '@/domains/services';

type MeRouteDeps = { instance: FastifyInstance; usersService: IUsersService };

const buildMeUseCases = (props: MeRouteDeps) => {
  const getMeUseCase = new GetMeUseCase({ usersService: props.usersService });
  const patchMeProfileUseCase = new PatchMeProfileUseCase({ usersService: props.usersService });

  return {
    getMeUseCase,
    patchMeProfileUseCase,
  };
};

export const registerMeRoutes = (props: MeRouteDeps) => {
  const useCases = buildMeUseCases(props);

  new MeRoutesController({
    fastify: props.instance,
    ...useCases,
  }).register();
};
