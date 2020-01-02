import { isArray } from 'util';
import { EMPTY_OBJ } from '../utils';
import { TriggerOpTypes, TrackOpTypes } from './operations';

export const ITERATE_KEY = Symbol('iterate');

export enum ReactiveEffectType {
  COMPUTED,
  COMPONENT,
  EFFECT,
}

export interface ReactiveEffectOptions {
  lazy?: boolean;
  scheduler?: (run: Function) => void;
}

export interface ReactiveEffect<T = any> {
  _isEffect: true;
  type: ReactiveEffectType;
  deps: Array<Dep>;
  options: ReactiveEffectOptions;

  raw: () => T;
  (): T;
}

export type Dep = Set<ReactiveEffect>;
export type KeyToDepMap = Map<any, Dep>;
export const targetMap = new WeakMap<any, KeyToDepMap>();

export let activeEffect: ReactiveEffect | undefined;

const computedRunners = new Set<ReactiveEffect>();
const componentRunners = new Set<ReactiveEffect>();

export function isEffect(fn: any): fn is ReactiveEffect {
  return fn != null && fn._isEffect === true;
}

export function effect<T = any>(
  fn: () => T,
  options: ReactiveEffectOptions = EMPTY_OBJ,
): ReactiveEffect<T> {
  if (isEffect(fn)) {
    fn = fn.raw;
  }
  const effect = createReactiveEffect(fn, options);
  if (!options.lazy) {
    effect();
  }
  return effect;
}

function createReactiveEffect<T = any>(
  fn: () => T,
  options: ReactiveEffectOptions,
): ReactiveEffect<T> {
  const effect = function reactiveEffect(...args: unknown[]): unknown {
    return run(effect, fn, args);
  } as ReactiveEffect;
  effect._isEffect = true;
  effect.raw = fn;
  effect.deps = [];
  effect.options = options;
  return effect;
}

function run(effect: ReactiveEffect, fn: Function, args: unknown[]): unknown {
  // currently not support nested effect
  try {
    activeEffect = effect;
    return fn(...args);
  } finally {
    activeEffect = undefined;
  }
}

export function trigger(target: object, type: TriggerOpTypes, key?: unknown): void {
  const depsMap = targetMap.get(target);
  if (depsMap === void 0) {
    // never been tracked
    return;
  }

  if (type === TriggerOpTypes.CLEAR) {
    // collection being cleared, trigger all effects for target
    depsMap.forEach(dep => {
      addRunners(componentRunners, computedRunners, dep);
    });
  } else {
    // schedule runs for SET | ADD | DELETE
    if (key !== void 0) {
      addRunners(componentRunners, computedRunners, depsMap.get(key));
    }
    // also run for iteration key on ADD | DELETE
    if (type === TriggerOpTypes.ADD || type === TriggerOpTypes.DELETE) {
      const iterationKey = isArray(target) ? 'length' : ITERATE_KEY;
      addRunners(componentRunners, computedRunners, depsMap.get(iterationKey));
    }
  }
}

export function track(
  target: object,
  type: TrackOpTypes,
  effect?: ReactiveEffect,
  key?: unknown,
): void {
  let depsMap = targetMap.get(target);
  if (depsMap === void 0) {
    targetMap.set(target, (depsMap = new Map()));
  }

  let dep = depsMap.get(key);
  if (dep === void 0) {
    depsMap.set(key, (dep = new Set()));
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const currentEffect = effect || activeEffect!;

  if (!dep.has(currentEffect)) {
    dep.add(currentEffect);
    currentEffect.deps.push(dep);
  }
}

export function runxx(): void {
  computedRunners.forEach(scheduleRun);
  componentRunners.forEach(scheduleRun);
}

function scheduleRun(_source: ReactiveEffect): void {
  //
}

function addRunners(
  componentRunners: Set<ReactiveEffect>,
  computedRunners: Set<ReactiveEffect>,
  sourcesToAdd: Set<ReactiveEffect> | undefined,
): void {
  if (sourcesToAdd !== void 0) {
    sourcesToAdd.forEach(source => {
      if (source.type === ReactiveEffectType.COMPUTED) {
        computedRunners.add(source);
      } else {
        componentRunners.add(source);
      }
    });
  }
}
