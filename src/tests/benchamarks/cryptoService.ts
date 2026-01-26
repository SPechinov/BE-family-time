import { CryptoService } from '@/services';
import { benchmark } from '../utils';

const cryptoService = new CryptoService();

const startCryptoService = () => {
  cryptoService.encrypt('Sergei', 'secret');
};

export const benchmarkCryptoService = () => {
  const { avg, median } = benchmark(startCryptoService, 100);
  console.log(`\nAverage: ${avg}, Median: ${median}`);
};
