import { useMemo, useRef } from 'react';
import { Ref, TraceRef } from '../reactivity';
import { ISetup, SetupBinds, createSetup } from './createSetup';

export type ISetupReturn<T> = { [P in keyof T]: T[P] extends Ref ? TraceRef<T[P]> : T[P] };

export function useCreateSetup<P extends Record<string, any>, T extends any[]>(
  setup: ISetup<P, T>,
  ...args: T
): SetupBinds<P> {
  const bindsRef = useRef<SetupBinds<P>>(null as any);
  useMemo(() => {
    bindsRef.current = createSetup(setup, ...args);
  }, []);

  return bindsRef.current;
}
