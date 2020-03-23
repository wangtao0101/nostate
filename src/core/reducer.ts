import { mutation } from '../reactivity';
// eslint-disable-next-line @typescript-eslint/camelcase
import { unstable_batchedUpdates } from 'react-dom';

export function reducer<T extends any[]>(fn: (...args: T) => void) {
  return (...args: T): void => {
    mutation(() => {
      unstable_batchedUpdates(() => {
        fn(...args);
      });
    });
  };
}
