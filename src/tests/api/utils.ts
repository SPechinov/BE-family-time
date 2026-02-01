import { generateRandomEmail, request } from '../utils';
import { URL_REGISTRATION_END, URL_REGISTRATION_START } from './constants';

export const newUser = async (props: { email?: string }) => {
  const email = props.email ?? generateRandomEmail();
  const responseStart = await request('POST', URL_REGISTRATION_START, { email: props.email });
  const otpCode = responseStart.headers.get('x-dev-otp-code');

  const body = {
    email,
    otpCode,
    firstName: 'TestName',
    password: 'test-pass',
  };

  await request('POST', URL_REGISTRATION_END, body);
};
