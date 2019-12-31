import { unlockValue, lockValue } from './lock';

export function reducer<T extends []>(fn: (...args: T) => void) {
  return (...args: T): void => {
    unlockValue();
    fn(...args);
    lockValue();
  };
}
