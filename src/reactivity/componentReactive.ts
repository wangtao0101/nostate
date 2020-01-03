import { ReactiveEffectType, effect, ReactiveEffect } from './effect';
import { NOOP } from '../utils';
import { reactive } from './reactive';

export interface ComponentRef<T = any> {
  readonly effect: ReactiveEffect<T>;
  readonly value: T;
}

export function componentReactive<T>(target: T, scheduler: () => void): ComponentRef<T> {
  const runner = effect(NOOP, {
    lazy: true,
    // mark effect as component so that it gets priority during trigger
    type: ReactiveEffectType.COMPONENT,
    scheduler: () => {
      scheduler();
    }
  });

  const value = reactive(target, runner);

  return {
    _isRef: true,
    // expose effect so component can be stopped
    effect: runner,
    value
  } as any;
}
