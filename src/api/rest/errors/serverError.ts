export class ServerError extends Error {
  constructor(props: { message: string }) {
    super(props.message);
  }
}