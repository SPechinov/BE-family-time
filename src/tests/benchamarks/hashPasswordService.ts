import { HashPasswordService } from '@/services';
import { benchmark } from '../utils';
import { Logger } from '@/pkg';

const hashPasswordService = new HashPasswordService();

const benchmarkEncrypt = async () => {
  const encrypt = async () => {
    await hashPasswordService.hash('test-password');
  };

  const { avg, median } = await benchmark(encrypt, 100);
  console.log(`\nAverage: ${avg}, Median: ${median}`);
};

const benchmarkDecrypt = async () => {
  const decrypt = async () => {
    await hashPasswordService.verify({
      logger: new Logger(),
      passwordPlain: 'test-password',
      passwordHashed:
        'fde3c15193d124d9be4312c44b5735409bb07e3edf0861ff012330b309363ea0:c5f1d58511b12a1d65d445b420c0847e9f8a2fb5e3fd5454be330417cfab64ccf81d6c18652da653d6d896b7481d8fed62d5fd98e040f4cbb8a0ea4f71234b68',
    });
  };
  const { avg, median } = await benchmark(decrypt, 100);
  console.log(`\nAverage: ${avg}, Median: ${median}`);
};

export const benchmarkHashPasswordService = async () => {
  console.log('Benchmark Hash Password Service');
  await benchmarkEncrypt();
  await benchmarkDecrypt();
};
