export interface HookuxMeta {
  global: boolean;
  name: string;
  module: string;
}

/* TODO: createHookux function can be replaced by decorator after typescript eanble decorator on function. */

export function createGlobalHookux<T>(setup: T, module: string, name: string): T {
  // @ts-ignore TODO: should use Reflect.defineMeta when the Reflect.defineMeta feature enable.
  setup.meta = {
    global: true,
    name,
    module
  };
  return setup;
}

export function createLocalHookux<T>(setup: T, module: string, name: string): T {
  // @ts-ignore
  setup.meta = {
    global: false,
    name,
    module
  };
  return setup;
}
