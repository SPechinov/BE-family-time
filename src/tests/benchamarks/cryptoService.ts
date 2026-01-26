import { CryptoService } from '@/services';
import { benchmark } from '../utils';

const cryptoService = new CryptoService();

const benchmarkEncrypt = () => {
  const encrypt = () => {
    cryptoService.encrypt('Sergei', 'secret');
  };

  const { avg, median } = benchmark(encrypt, 100);
  console.log(`\nAverage: ${avg}, Median: ${median}`);
};

const benchmarkDecrypt = () => {
  const decrypt = () => {
    cryptoService.decrypt('e26e56a44ed864c90fb403c02a93cb9e:50244ffe47839ccc408dc412e09765bf:542afb2d6653', 'secret');
  };

  const { avg, median } = benchmark(decrypt, 100);
  console.log(`\nAverage: ${avg}, Median: ${median}`);
};

export const benchmarkCryptoService = () => {
  console.log('Benchmark Crypto Service');
  benchmarkEncrypt();
  benchmarkDecrypt();
};
