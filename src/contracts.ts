export type SuccessCase<D> = {
  error: null;
  data: D;
};
export type FailureCase<E> = {
  error: string;
  message: E;
};
export type ErrorProne<D, E = string> = SuccessCase<D> | FailureCase<E>;
