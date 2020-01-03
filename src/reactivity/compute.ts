import { effect, ReactiveEffect, activeEffect, ReactiveEffectType } from './effect';
import { CollectionTypes } from './collectionHandlers';

const isRefSymbol = Symbol();

export interface Ref<T = any> {
  // This field is necessary to allow TS to differentiate a Ref from a plain
  // object that happens to have a "value" field.
  // However, checking a symbol on an arbitrary object is much slower than
  // checking a plain property, so we use a _isRef plain property for isRef()
  // check in the actual implementation.
  // The reason for not just declaring _isRef in the interface is because we
  // don't want this internal field to leak into userland autocompletion -
  // a private symbol, on the other hand, achieves just that.
  [isRefSymbol]: true;
  value: UnwrapRef<T>;
}

type UnwrapArray<T> = { [P in keyof T]: UnwrapRef<T[P]> };

// Recursively unwraps nested value bindings.
export type UnwrapRef<T> = {
  cRef: T extends ComputedRef<infer V> ? UnwrapRef<V> : T;
  ref: T extends Ref<infer V> ? UnwrapRef<V> : T;
  array: T extends Array<infer V> ? Array<UnwrapRef<V>> & UnwrapArray<T> : T;
  object: { [K in keyof T]: UnwrapRef<T[K]> };
}[T extends ComputedRef<any>
  ? 'cRef'
  : T extends Ref
  ? 'ref'
  : T extends Array<any>
  ? 'array'
  : T extends Function | CollectionTypes
  ? 'ref' // bail out on types that shouldn't be unwrapped
  : T extends object
  ? 'object'
  : 'ref'];

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
