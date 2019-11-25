import { ReactiveSource, targetMap, ReactiveSourceType } from './proxy';
import { isArray } from 'util';

export const ITERATE_KEY = Symbol('iterate');

const computedRunners = new Set<ReactiveSource>();
const componentRunners = new Set<ReactiveSource>();

export const enum OperationTypes {
  SET = 'SET',
  ADD = 'ADD',
  DELETE = 'DELETE',
  CLEAR = 'CLEAR',
  GET = 'GET',
  HAS = 'HAS',
  ITERATE = 'ITERATE',
}

export function trigger(
  _source: ReactiveSource,
  target: object,
  type: OperationTypes,
  key?: unknown,
): void {
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
  source: ReactiveSource,
  target: object,
  type: OperationTypes,
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

  if (!dep.has(source)) {
    dep.add(source);
    source.deps.push(dep);
  }
}

export function run(): void {
  computedRunners.forEach(scheduleRun);
  componentRunners.forEach(scheduleRun);
}

function scheduleRun(_source: ReactiveSource): void {
  //
}

function addRunners(
  componentRunners: Set<ReactiveSource>,
  computedRunners: Set<ReactiveSource>,
  sourcesToAdd: Set<ReactiveSource> | undefined,
): void {
  if (sourcesToAdd !== void 0) {
    sourcesToAdd.forEach(source => {
      if (source.type === ReactiveSourceType.COMPUTED) {
        computedRunners.add(source);
      } else {
        componentRunners.add(source);
      }
    });
  }
}
