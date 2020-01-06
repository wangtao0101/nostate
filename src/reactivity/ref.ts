import { ComputedRef } from './computed';
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

export function isRef(r: any): r is Ref {
  return r ? r._isRef === true : false;
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
