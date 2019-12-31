import { isArray } from 'util';

export const ITERATE_KEY = Symbol('iterate');

export enum ReactiveEffectType {
  COMPUTED,
  COMPONENT,
  EFFECT,
}

export interface ReactiveEffect {
  _isEffect: true;
  type: ReactiveEffectType;
  deps: Array<Dep>;
}

export type Dep = Set<ReactiveEffect>;
export type KeyToDepMap = Map<any, Dep>;
export const targetMap = new WeakMap<any, KeyToDepMap>();

export let activeEffect: ReactiveEffect | undefined;

const computedRunners = new Set<ReactiveEffect>();
const componentRunners = new Set<ReactiveEffect>();

export const enum OperationTypes {
  SET = 'SET',
  ADD = 'ADD',
  DELETE = 'DELETE',
  CLEAR = 'CLEAR',
  GET = 'GET',
  HAS = 'HAS',
  ITERATE = 'ITERATE',
}

export function trigger(target: object, type: OperationTypes, key?: unknown): void {
  const depsMap = targetMap.get(target);
  if (depsMap === void 0) {
    // never been tracked
    return;
  }

  if (type === OperationTypes.CLEAR) {
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
    if (type === OperationTypes.ADD || type === OperationTypes.DELETE) {
      const iterationKey = isArray(target) ? 'length' : ITERATE_KEY;
      addRunners(componentRunners, computedRunners, depsMap.get(iterationKey));
    }
  }
}

export function track(
  target: object,
  type: OperationTypes,
  effect?: ReactiveEffect,
  key?: unknown,
): void {
  if (type === OperationTypes.ITERATE) {
    key = ITERATE_KEY;
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

export function run(): void {
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
