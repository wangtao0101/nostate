export interface HookuxMeta {
  global: boolean;
  name: string;
  module: string;
}

/* TODO: createHookux function can be replaced by decorator after typescript enable decorator for function. */

export function createGlobalHookux<ISetupReturn extends Record<string, any>>(
  setup: () => ISetupReturn,
  module: string,
  name: string
): () => ISetupReturn {
  // TODO: should use Reflect.defineMeta when the Reflect.defineMeta feature enable.
  (setup as any).meta = {
    global: true,
    name,
    module
  };
  return setup;
}

export function createLocalHookux<T>(setup: T, module: string, name: string): T {
  (setup as any).meta = {
    global: false,
    name,
    module
  };
  return setup;
}
