export function fork<T, R>(f1: (v: T) => R, f2: (v: T) => R) {
  return function (value: T) {
    return f1(value) || f2(value);
  };
}
