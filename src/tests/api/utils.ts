import { generateRandomEmail, request } from '../utils';
import { URL_REG_END, URL_REG_START } from './constants';

export const newUser = async (props: { email?: string }) => {
  const email = props.email ?? generateRandomEmail();
  const responseStart = await request('POST', URL_REG_START, { email: props.email });
  const otpCode = responseStart.headers.get('x-dev-otp-code');

  const body = {
    email,
    otpCode,
    firstName: 'TestName',
    password: 'test-pass',
  };

  await request('POST', URL_REG_END, body);
};
