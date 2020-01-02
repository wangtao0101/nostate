import { mutation } from './lock';

export function reducer<T extends []>(fn: (...args: T) => void) {
  return (...args: T): void => {
    mutation(() => {
      fn(...args);
    });
  };
}
