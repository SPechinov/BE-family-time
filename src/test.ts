import { generateRandomEmail, request } from '@/tests/utils';
import { URL_REGISTRATION_END, URL_REGISTRATION_START } from '@/tests/api/constants';

const emails = Array.from({ length: 500 }, generateRandomEmail);
console.log(emails);

const registrationUser = async (email: string) => {
  const responseStart = await request('POST', URL_REGISTRATION_START, { email });
  const otpCode = responseStart.headers.get('x-dev-otp-code');

  const result = await request('POST', URL_REGISTRATION_END, {
    email,
    otpCode,
    firstName: 'TestName',
    password: 'test-pass',
  });

  if (result.status >= 400) {
    console.log(`Request finished with status: ${result.status}, email: ${email}`);
    throw new Error();
  }
};

(async () => {
  const startTime = performance.now();
  const times: number[] = [];

  const promises: Promise<void>[] = [];
  for (const email of emails) {
    promises.push(
      new Promise((resolve) => {
        const startRequestTime = performance.now();
        registrationUser(email)
          .then(() => {
            times.push(performance.now() - startRequestTime);
            resolve();
          })
          .catch(() => resolve());
      }),
    );
  }
  await Promise.all(promises);

  console.log(`Success requests: ${times.length} / ${emails.length}`);
  console.log(`Average time: ${(times.reduce((a, b) => a + b, 0) / times.length).toFixed(2)}ms`);
  console.log(`Min time: ${Math.min(...times).toFixed(2)}ms`);
  console.log(`Max time: ${Math.max(...times).toFixed(2)}ms`);
  console.log(`All requests: ${(performance.now() - startTime).toFixed(2)}ms`);
})();
