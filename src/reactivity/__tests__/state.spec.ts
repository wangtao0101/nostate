import { unlockValue, lockValue } from '../lock';
import { state } from '../state';
import { reactive } from '../reactive';
import { stop } from '../effect';

describe('reactivity/state', () => {
  beforeAll(() => {
    unlockValue();
  });

  afterAll(() => {
    lockValue();
  });

  it('should trigger componentState scheduler', () => {
    const original = { foo: 1 };
    const observed = reactive(original);

    const fnSpy = jest.fn(() => {});

    const componentState = state(original, fnSpy);

    expect(componentState.value.foo).toBe(1);
    observed.foo++;

    expect(componentState.value.foo).toBe(2);
    expect(fnSpy).toHaveBeenCalledTimes(1);
  });

  it('should forbid change state on component state', () => {
    const original = { foo: 1 };

    const fnSpy = jest.fn(() => {});

    const componentState = state(original, fnSpy);

    expect(() => {
      delete componentState.value.foo;
    }).toThrowError(/Cannot delete key: foo of hux state except in reducer./);

    expect(() => {
      componentState.value.foo = 2;
    }).toThrowError(/Cannot set key: foo of hux state except in reducer./);
  });

  it('should no longer call scheduler when stopped', () => {
    const original = { foo: 1 };
    const observed = reactive(original);

    const fnSpy = jest.fn(() => {});

    const componentState = state(original, fnSpy);

    expect(componentState.value.foo).toBe(1);
    observed.foo++;

    expect(fnSpy).toHaveBeenCalledTimes(1);

    stop(componentState.effect);

    observed.foo++;

    expect(fnSpy).toHaveBeenCalledTimes(1);
  });
});
