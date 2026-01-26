import { benchmarkHashService } from './tests/benchamarks';
benchmarkHashService();

// import { CONFIG } from '@/config';
// import { newPostgresConnection, newRedisConnection } from '@/pkg';
// import { newApiRest } from '@/api/rest';

// const run = async () => {
//   const [redis, postgres] = await Promise.all([
//     newRedisConnection(CONFIG.redis),
//     newPostgresConnection(CONFIG.postgres),
//   ]);

//   const apiRest = await newApiRest({
//     redis,
//     postgres,
//   });

//   const destroyApp = async () => {
//     await apiRest.close();
//     console.log('\n');
//     console.log('API сервер выключен');

//     redis.destroy();
//     console.log('Redis отключен');

//     postgres.end();
//     console.log('PostgreSQL отключен');

//     process.exit(0);
//   };

//   process.on('SIGINT', destroyApp);
//   process.on('SIGTERM', destroyApp);
// };

// run();
