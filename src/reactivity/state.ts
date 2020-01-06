import { ReactiveEffectType, effect, ReactiveEffect } from './effect';
import { NOOP } from '../utils';
import { reactive } from './reactive';

export interface StateRef<T = any> {
  readonly effect: ReactiveEffect<T>;
  readonly value: T;
}

export function state<T>(target: T, scheduler: () => void): StateRef<T> {
  const runner = effect(NOOP, {
    lazy: true,
    // mark effect as state so that it gets priority during trigger
    type: ReactiveEffectType.STATE,
    scheduler: () => {
      scheduler();
    }
  });

  const value = reactive(target, runner);

  return {
    _isRef: true,
    // expose effect so state ref can be stopped
    effect: runner,
    value
  } as any;
}
