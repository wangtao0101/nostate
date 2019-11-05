export const enum OperationTypes {
  SET = 'SET',
  ADD = 'ADD',
  DELETE = 'DELETE',
  CLEAR = 'CLEAR',
  GET = 'GET',
  HAS = 'HAS',
  ITERATE = 'ITERATE',
}

export function trigger(_target: object, _type: OperationTypes, _key?: unknown): void {
  //
}

export function track(_target: object, _type: OperationTypes, _key?: unknown): void {
  //
}
