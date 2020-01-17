import { reactive, isReactive, toRaw, reactiveTrace } from '../../index';
import { unlockValue, lockValue } from '../../lock';

describe('reactivity/traceRef', () => {
  describe('Set', () => {
    beforeAll(() => {
      unlockValue();
    });

    afterAll(() => {
      lockValue();
    });

    it('instanceof', () => {
      const original = new Set();
      const traceRef = reactiveTrace(original, () => {});
      expect(isReactive(traceRef.value)).toBe(true);
      expect(original instanceof Set).toBe(true);
      expect(traceRef.value instanceof Set).toBe(true);
    });

    it('should observe mutations', () => {
      const original = new Set();
      const set = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      let dummy = traceRef.value.has('value');
      expect(dummy).toBe(false);

      set.add('value');
      dummy = traceRef.value.has('value');
      expect(dummy).toBe(true);
      expect(fnSpy).toHaveBeenCalledTimes(1);

      set.delete('value');
      dummy = traceRef.value.has('value');
      expect(dummy).toBe(false);

      expect(fnSpy).toHaveBeenCalledTimes(2);
    });

    it('should observe for of iteration', () => {
      const original = new Set() as Set<number>;
      const set = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      const cal = () => {
        let dummy = 0;
        for (const num of traceRef.value) {
          dummy += num;
        }
        return dummy;
      };

      expect(cal()).toBe(0);
      set.add(2);
      set.add(1);
      expect(cal()).toBe(3);
      set.delete(2);
      expect(cal()).toBe(1);
      set.clear();
      expect(cal()).toBe(0);

      expect(fnSpy).toHaveBeenCalledTimes(4);
    });

    it('should observe forEach iteration', () => {
      const original = new Set() as Set<number>;
      const set = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      const cal = () => {
        let dummy = 0;
        traceRef.value.forEach(num => (dummy += num));
        return dummy;
      };

      expect(cal()).toBe(0);
      set.add(2);
      set.add(1);
      expect(cal()).toBe(3);
      set.delete(2);
      expect(cal()).toBe(1);
      set.clear();
      expect(cal()).toBe(0);

      expect(fnSpy).toHaveBeenCalledTimes(4);
    });

    it('should observe values iteration', () => {
      const original = new Set() as Set<number>;
      const set = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      const cal = () => {
        let dummy = 0;
        for (const num of traceRef.value.values()) {
          dummy += num;
        }
        return dummy;
      };

      expect(cal()).toBe(0);
      set.add(2);
      set.add(1);
      expect(cal()).toBe(3);
      set.delete(2);
      expect(cal()).toBe(1);
      set.clear();
      expect(cal()).toBe(0);

      expect(fnSpy).toHaveBeenCalledTimes(4);
    });

    it('should observe keys iteration', () => {
      const original = new Set() as Set<number>;
      const set = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      const cal = () => {
        let dummy = 0;
        for (const num of traceRef.value.keys()) {
          dummy += num;
        }
        return dummy;
      };

      expect(cal()).toBe(0);
      set.add(2);
      set.add(1);
      expect(cal()).toBe(3);
      set.delete(2);
      expect(cal()).toBe(1);
      set.clear();
      expect(cal()).toBe(0);

      expect(fnSpy).toHaveBeenCalledTimes(4);
    });

    it('should observe entries iteration', () => {
      const original = new Set() as Set<number>;
      const set = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      const cal = () => {
        let dummy = 0;
        for (const [key, num] of traceRef.value.entries()) {
          key;
          dummy += num;
        }
        return dummy;
      };

      expect(cal()).toBe(0);
      set.add(2);
      set.add(1);
      expect(cal()).toBe(3);
      set.delete(2);
      expect(cal()).toBe(1);
      set.clear();
      expect(cal()).toBe(0);

      expect(fnSpy).toHaveBeenCalledTimes(4);
    });

    it('should observe size mutations', () => {
      const original = new Set() as Set<string>;
      const set = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      const cal = () => {
        return traceRef.value.size;
      };

      expect(cal()).toBe(0);
      set.add('value');
      set.add('value2');
      expect(cal()).toBe(2);
      set.delete('value');
      expect(cal()).toBe(1);
      set.clear();
      expect(cal()).toBe(0);

      expect(fnSpy).toHaveBeenCalledTimes(4);
    });

    it('should not observe raw iterations', () => {
      const original = new Set() as Set<number>;
      const set = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      const cal = () => {
        let dummy = 0;
        for (const [num] of toRaw(traceRef.value).entries()) {
          dummy += num;
        }
        for (const num of toRaw(traceRef.value).keys()) {
          dummy += num;
        }
        for (const num of toRaw(traceRef.value).values()) {
          dummy += num;
        }
        toRaw(traceRef.value).forEach(num => {
          dummy += num;
        });
        for (const num of toRaw(traceRef.value)) {
          dummy += num;
        }
        return dummy;
      };

      expect(cal()).toBe(0);
      set.add(2);
      set.add(3);
      set.delete(2);

      expect(fnSpy).toHaveBeenCalledTimes(0);
    });

    it('should not be triggered by raw mutations', () => {
      const original = new Set() as Set<string>;
      const set = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);
      const dummy = traceRef.value.has('value');

      expect(dummy).toBe(false);
      toRaw(set).add('value');

      toRaw(set).delete('value');
      toRaw(set).clear();

      expect(fnSpy).toHaveBeenCalledTimes(0);
    });

    it('should not observe raw size mutations', () => {
      const original = new Set() as Set<string>;
      const set = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);
      const dummy = toRaw(traceRef.value).size;

      expect(dummy).toBe(0);
      set.add('value');

      expect(fnSpy).toHaveBeenCalledTimes(0);
    });

    it('should observe nested values in iterations (forEach)', () => {
      const original = new Set([{ foo: 1 }]);
      const set = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      const cal = () => {
        let dummy = 0;
        traceRef.value.forEach(value => {
          expect(isReactive(value)).toBe(true);
          dummy += value.foo;
        });
        return dummy;
      };

      expect(cal()).toBe(1);
      set.forEach(value => {
        value.foo++;
      });
      expect(cal()).toBe(2);

      expect(fnSpy).toHaveBeenCalledTimes(1);
    });

    it('should observe nested values in iterations (values)', () => {
      const original = new Set([{ foo: 1 }]);
      const set = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      const cal = () => {
        let dummy = 0;
        for (const value of traceRef.value.values()) {
          expect(isReactive(value)).toBe(true);
          dummy += value.foo;
        }
        return dummy;
      };

      expect(cal()).toBe(1);
      set.forEach(value => {
        value.foo++;
      });
      expect(cal()).toBe(2);

      expect(fnSpy).toHaveBeenCalledTimes(1);
    });

    it('should observe nested values in iterations (entries)', () => {
      const original = new Set([{ foo: 1 }]);
      const set = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      const cal = () => {
        let dummy = 0;
        for (const [key, value] of traceRef.value.entries()) {
          expect(isReactive(key)).toBe(true);
          expect(isReactive(value)).toBe(true);
          dummy += value.foo;
        }
        return dummy;
      };

      expect(cal()).toBe(1);
      set.forEach(value => {
        value.foo++;
      });
      expect(cal()).toBe(2);

      expect(fnSpy).toHaveBeenCalledTimes(1);
    });

    it('should observe nested values in iterations (for...of)', () => {
      const original = new Set([{ foo: 1 }]);
      const set = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      const cal = () => {
        let dummy = 0;
        for (const value of traceRef.value) {
          expect(isReactive(value)).toBe(true);
          dummy += value.foo;
        }
        return dummy;
      };

      expect(cal()).toBe(1);
      set.forEach(value => {
        value.foo++;
      });
      expect(cal()).toBe(2);

      expect(fnSpy).toHaveBeenCalledTimes(1);
    });
  });
});
