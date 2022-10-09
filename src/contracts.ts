export type SuccessCase<D> = {
  error: null;
  data: D;
};
export type FailureCase<E> = {
  error: string;
  message: E;
};
export type ErrorProne<D, E = string> = SuccessCase<D> | FailureCase<E>;

export interface Fleeting<T> {
  expiresIn: number;
  data: T;
}

export interface DayWithChanges {
  day: number;
  month: number;
  year: number;
  version: number;
}

export type Subject = {
  index: number;
  title: string;
  cabinet: string;
};

export interface Schedule {
  group: string;
  subjects: Subject[];
}

export interface CachedSchedule {
  data: Schedule[];
  version: number;
}
