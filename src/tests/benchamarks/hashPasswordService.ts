import { HashPasswordService } from '@/services';
import { benchmark } from '../utils';

const hashPasswordService = new HashPasswordService();

const benchmarkEncrypt = () => {
  const encrypt = () => {
    hashPasswordService.hashPassword('test-password');
  };

  const { avg, median } = benchmark(encrypt, 100);
  console.log(`\nAverage: ${avg}, Median: ${median}`);
};

const benchmarkDecrypt = () => {
  const decrypt = () => {
    hashPasswordService.verifyPassword(
      'test-password',
      'fde3c15193d124d9be4312c44b5735409bb07e3edf0861ff012330b309363ea0:c5f1d58511b12a1d65d445b420c0847e9f8a2fb5e3fd5454be330417cfab64ccf81d6c18652da653d6d896b7481d8fed62d5fd98e040f4cbb8a0ea4f71234b68',
    );
  };
  const { avg, median } = benchmark(decrypt, 100);
  console.log(`\nAverage: ${avg}, Median: ${median}`);
};

export const benchmarkHashPasswordService = () => {
  console.log('Benchmark Hash Password Service');
  benchmarkEncrypt();
  benchmarkDecrypt();
};
