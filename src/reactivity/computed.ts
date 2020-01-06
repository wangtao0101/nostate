import { effect, ReactiveEffect, activeEffect, ReactiveEffectType } from './effect';
import { UnwrapRef, Ref } from './ref';

export interface ComputedRef<T = any> extends Ref<T> {
  readonly effect: ReactiveEffect<T>;
  readonly value: UnwrapRef<T>;
}

export type ComputedGetter<T> = () => T;
export type ComputedSetter<T> = (v: T) => void;

export function computed<T>(getter: ComputedGetter<T>): ComputedRef<T> {
  let dirty = true;
  let value: T;

  const runner = effect(getter, {
    lazy: true,
    // mark effect as computed so that it gets priority during trigger
    type: ReactiveEffectType.COMPUTED,
    scheduler: () => {
      dirty = true;
    }
  });
  return {
    _isRef: true,
    // expose effect so computed can be stopped
    effect: runner,
    get value() {
      if (dirty) {
        value = runner();
        dirty = false;
      }
      // When computed effects are accessed in a parent effect, the parent
      // should track all the dependencies the computed property has tracked.
      // This should also apply for chained computed properties.
      trackChildRun(runner);
      return value;
    }
  } as any;
}

function trackChildRun(childRunner: ReactiveEffect): void {
  if (activeEffect === undefined) {
    return;
  }
  for (let i = 0; i < childRunner.deps.length; i++) {
    const dep = childRunner.deps[i];
    if (!dep.has(activeEffect)) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep);
    }
  }
}
