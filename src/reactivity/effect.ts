import { isArray } from 'util';
import { EMPTY_OBJ } from '../utils';
import { TriggerOpTypes, TrackOpTypes } from './operations';
import { TRACK_LOCKED } from './lock';

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
  active: boolean;
  type: ReactiveEffectType;
  deps: Array<Dep>;
  options: ReactiveEffectOptions;

  raw: () => T;
  (): T;
}

export type Dep = Set<ReactiveEffect>;
export type KeyToDepMap = Map<any, Dep>;
export const targetMap = new WeakMap<any, KeyToDepMap>();

const effectStack: ReactiveEffect[] = [];
export let activeEffect: ReactiveEffect | undefined;

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
  effect.active = true;
  effect.raw = fn;
  effect.deps = [];
  effect.options = options;
  return effect;
}

export function stop(effect: ReactiveEffect): void {
  if (effect.active) {
    cleanup(effect);
    effect.active = false;
  }
}

function run(effect: ReactiveEffect, fn: Function, args: unknown[]): unknown {
  if (!effect.active) {
    return fn(...args);
  }
  if (!effectStack.includes(effect)) {
    cleanup(effect);
    try {
      effectStack.push(effect);
      activeEffect = effect;
      return fn(...args);
    } finally {
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1];
    }
  }
}

function cleanup(effect: ReactiveEffect): void {
  const { deps } = effect;
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect);
    }
    deps.length = 0;
  }
}

export function trigger(target: object, type: TriggerOpTypes, key?: unknown): void {
  const depsMap = targetMap.get(target);
  if (depsMap === void 0) {
    // never been tracked
    return;
  }

  const effects = new Set<ReactiveEffect>();
  const computedRunners = new Set<ReactiveEffect>();
  const componentRunners = new Set<ReactiveEffect>();

  if (type === TriggerOpTypes.CLEAR) {
    // collection being cleared, trigger all effects for target
    depsMap.forEach(dep => {
      addRunners(effects, computedRunners, componentRunners, dep);
    });
  } else {
    // schedule runs for SET | ADD | DELETE
    if (key !== void 0) {
      addRunners(effects, computedRunners, componentRunners, depsMap.get(key));
    }
    // also run for iteration key on ADD | DELETE
    if (type === TriggerOpTypes.ADD || type === TriggerOpTypes.DELETE) {
      const iterationKey = isArray(target) ? 'length' : ITERATE_KEY;
      addRunners(effects, computedRunners, componentRunners, depsMap.get(iterationKey));
    }
  }

  const run = (effect: ReactiveEffect): void => {
    if (effect.options.scheduler !== void 0) {
      effect.options.scheduler(effect);
    } else {
      effect();
    }
  };
  // Important: computed effects must be run first so that computed getters
  // can be invalidated before any normal effects that depend on them are run.
  computedRunners.forEach(run);
  effects.forEach(run);
  componentRunners.forEach(run);
}

export function track(
  target: object,
  _type: TrackOpTypes,
  effect?: ReactiveEffect,
  key?: unknown,
): void {
  if (effect === undefined && TRACK_LOCKED) {
    return;
  }

  if (effect === undefined && activeEffect === undefined) {
    return;
  }

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

function addRunners(
  effects: Set<ReactiveEffect>,
  computedRunners: Set<ReactiveEffect>,
  componentRunners: Set<ReactiveEffect>,
  sourcesToAdd: Set<ReactiveEffect> | undefined,
): void {
  if (sourcesToAdd !== void 0) {
    sourcesToAdd.forEach(source => {
      if (source.type === ReactiveEffectType.COMPUTED) {
        computedRunners.add(source);
      } else if (source.type === ReactiveEffectType.COMPONENT) {
        componentRunners.add(source);
      } else {
        effects.add(source);
      }
    });
  }
}
