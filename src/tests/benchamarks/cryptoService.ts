import { CryptoService } from '@/services';
import { benchmark } from '../utils';

const cryptoService = new CryptoService();

const benchmarkEncrypt = async () => {
  const encrypt = async () => {
    await cryptoService.encrypt('Sergei', 'secret123456789');
  };

  const { avg, median } = await benchmark(encrypt, 10);
  console.log(`\nAverage: ${avg}, Median: ${median}`);
};

const benchmarkDecrypt = async () => {
  const decrypt = async () => {
    await cryptoService.decrypt(
      'e26e56a44ed864c90fb403c02a93cb9e:50244ffe47839ccc408dc412e09765bf:542afb2d6653',
      'secret123456789',
    );
  };

  const { avg, median } = await benchmark(decrypt, 10);
  console.log(`\nAverage: ${avg}, Median: ${median}`);
};

export const benchmarkCryptoService = async () => {
  console.log('Benchmark Crypto Service');
  await benchmarkEncrypt();
  await benchmarkDecrypt();
};
