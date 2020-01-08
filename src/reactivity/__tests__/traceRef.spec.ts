import { unlockValue, lockValue } from '../lock';
import { reactiveTrace, computedTrace } from '../traceRef';
import { reactive } from '../reactive';
import { stop } from '../effect';
import { computed } from '../computed';

describe('reactivity/traceRef', () => {
  beforeAll(() => {
    unlockValue();
  });

  afterAll(() => {
    lockValue();
  });

  it('should trigger reactive trace scheduler', () => {
    const original = { foo: 1 };
    const observed = reactive(original);

    const fnSpy = jest.fn(() => {});

    const traceRef = reactiveTrace(original, fnSpy);

    expect(traceRef.value.foo).toBe(1);
    observed.foo++;

    expect(traceRef.value.foo).toBe(2);
    expect(fnSpy).toHaveBeenCalledTimes(1);
  });

  it('should forbid change state on component state', () => {
    const original = { foo: 1 };

    const fnSpy = jest.fn(() => {});

    const traceRef = reactiveTrace(original, fnSpy);

    expect(() => {
      delete traceRef.value.foo;
    }).toThrowError(/Cannot delete key: foo of hux state except in reducer./);

    expect(() => {
      traceRef.value.foo = 2;
    }).toThrowError(/Cannot set key: foo of hux state except in reducer./);
  });

  it('should no longer call scheduler when reactive trace effect stopped', () => {
    const original = { foo: 1 };
    const observed = reactive(original);

    const fnSpy = jest.fn(() => {});

    const traceRef = reactiveTrace(original, fnSpy);

    expect(traceRef.value.foo).toBe(1);
    observed.foo++;

    expect(fnSpy).toHaveBeenCalledTimes(1);

    stop(traceRef.effect);

    observed.foo++;

    expect(fnSpy).toHaveBeenCalledTimes(1);
  });

  it('should trigger computed trace scheduler', () => {
    const original = { foo: 1 };
    const observed = reactive(original);

    const cValue = computed(() => observed.foo + 1);

    const fnSpy = jest.fn(() => {});

    const traceRef = computedTrace(cValue, fnSpy);

    expect(traceRef.value).toBe(2);
    observed.foo++;

    expect(traceRef.value).toBe(3);
    expect(fnSpy).toHaveBeenCalledTimes(1);
  });

  it('should no longer call scheduler when computed trace effect stopped', () => {
    const original = { foo: 1 };
    const observed = reactive(original);

    const cValue = computed(() => observed.foo + 1);

    const fnSpy = jest.fn(() => {});

    const traceRef = computedTrace(cValue, fnSpy);

    expect(traceRef.value).toBe(2);
    observed.foo++;

    expect(fnSpy).toHaveBeenCalledTimes(1);

    stop(traceRef.effect);

    observed.foo++;

    expect(fnSpy).toHaveBeenCalledTimes(1);
  });
});
