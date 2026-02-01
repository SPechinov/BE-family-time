import { HashService } from '@/services';
import { benchmark } from '../utils';

const hashService = new HashService({
  salt: 'test-salt',
});

const benchmarkHash = async () => {
  const hash = () => {
    hashService.hash('test-data');
  };

  const { avg, median } = await benchmark(hash, 100);
  console.log(`\nAverage: ${avg}, Median: ${median}`);
};

export const benchmarkHashService = () => {
  console.log('Benchmark Hash Service');
  benchmarkHash();
};
