import { ReactiveEffectType, effect, ReactiveEffect } from './effect';
import { NOOP } from '../utils';
import { reactive } from './reactive';
import { Ref, UnwrapRef } from './ref';

export interface ReactiveTraceRef<T = any> extends Ref<T> {
  readonly effect: ReactiveEffect<T>;
  readonly value: UnwrapRef<T>;
}

export function reactiveTrace<T>(target: T, scheduler: () => void): ReactiveTraceRef<T> {
  const runner = effect(NOOP, {
    lazy: true,
    // mark effect as trace effect so that it gets low priority during trigger
    type: ReactiveEffectType.TRACE,
    scheduler: () => {
      scheduler();
    }
  });

  const value = reactive(target, runner);

  return {
    _isRef: true,
    // expose effect so trace ref can be stopped
    effect: runner,
    value
  } as any;
}
