const API_URL = 'http://localhost:8000/api';

export const request = async <R = undefined | object>(
  method: string,
  path: string,
  body?: object,
): Promise<{
  status: number;
  statusText: string;
  headers: Headers;
  body?: R;
}> => {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  return {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    body: await response.json().catch(() => null),
  };
};
