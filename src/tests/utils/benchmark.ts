export const benchmark = (fn: () => void, iterations = 1000) => {
  console.log(`Start benchmarking: ${fn.name}, iterations: ${iterations}`);
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);

    const percent = Math.round(((i + 1) / iterations) * 100);
    process.stdout.write(`\rProgress: ${percent}% (${i + 1}/${iterations})`);
  }

  times.sort((a, b) => a - b);
  const avg = (times.reduce((a, b) => a + b, 0) / iterations).toFixed(2);
  const median = times[Math.floor(iterations / 2)].toFixed(2);

  return { avg, median };
};
