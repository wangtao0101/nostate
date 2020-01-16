import { isReactive, reactiveTrace, reactive } from '../../index';
import { unlockValue, lockValue } from '../../lock';

describe('reactivity/traceRef', () => {
  describe('Map', () => {
    beforeAll(() => {
      unlockValue();
    });

    afterAll(() => {
      lockValue();
    });

    test('instanceof', () => {
      const original = new Map();
      const traceRef = reactiveTrace(original, () => {});
      expect(isReactive(traceRef.value)).toBe(true);
      expect(original instanceof Map).toBe(true);
      expect(traceRef.value instanceof Map).toBe(true);
    });

    it('should observe mutations', () => {
      const original = new Map();
      const map = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      let dummy = traceRef.value.get('key');
      expect(dummy).toBe(undefined);

      map.set('key', 'value');
      dummy = traceRef.value.get('key');
      expect(dummy).toBe('value');

      map.set('key', 'value2');
      dummy = traceRef.value.get('key');
      expect(dummy).toBe('value2');

      map.delete('key');
      dummy = traceRef.value.get('key');
      expect(dummy).toBe(undefined);

      expect(fnSpy).toHaveBeenCalledTimes(3);
    });

    it('should observe size mutations', () => {
      const original = new Map();
      const map = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      let dummy = traceRef.value.size;
      expect(dummy).toBe(0);

      map.set('key1', 'value');
      map.set('key2', 'value2');
      dummy = traceRef.value.size;
      expect(dummy).toBe(2);

      map.delete('key1');
      dummy = traceRef.value.size;
      expect(dummy).toBe(1);

      map.clear();
      dummy = traceRef.value.size;
      expect(dummy).toBe(0);

      expect(fnSpy).toHaveBeenCalledTimes(4);
    });

    it('should observe for of iteration', () => {
      const original = new Map();
      const map = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      const cal = () => {
        let dummy = 0;
        // eslint-disable-next-line no-unused-vars
        for (const [key, num] of traceRef.value) {
          key;
          dummy += num;
        }
        return dummy;
      };

      expect(cal()).toBe(0);
      map.set('key1', 3);
      expect(cal()).toBe(3);
      map.set('key2', 2);
      expect(cal()).toBe(5);
      map.delete('key1');
      expect(cal()).toBe(2);
      map.clear();
      expect(cal()).toBe(0);

      expect(fnSpy).toHaveBeenCalledTimes(4);
    });

    it('should observe values iteration', () => {
      const original = new Map();
      const map = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      const cal = () => {
        let dummy = 0;
        // eslint-disable-next-line no-unused-vars
        for (const num of traceRef.value.values()) {
          dummy += num;
        }
        return dummy;
      };

      expect(cal()).toBe(0);
      map.set('key1', 3);
      expect(cal()).toBe(3);
      map.set('key2', 2);
      expect(cal()).toBe(5);
      map.delete('key1');
      expect(cal()).toBe(2);
      map.clear();
      expect(cal()).toBe(0);

      expect(fnSpy).toHaveBeenCalledTimes(4);
    });

    it('should observe entries iteration', () => {
      const original = new Map();
      const map = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      let dummy;
      let dummy2;
      const cal = () => {
        dummy = '';
        dummy2 = 0;
        for (const [key, num] of traceRef.value.entries()) {
          dummy += key;
          dummy2 += num;
        }
        return [dummy];
      };

      cal();
      expect(dummy).toBe('');
      expect(dummy2).toBe(0);

      map.set('key1', 3);
      cal();
      expect(dummy).toBe('key1');
      expect(dummy2).toBe(3);

      map.set('key2', 2);
      cal();
      expect(dummy).toBe('key1key2');
      expect(dummy2).toBe(5);

      map.delete('key1');
      cal();
      expect(dummy).toBe('key2');
      expect(dummy2).toBe(2);

      map.clear();
      cal();
      expect(dummy).toBe('');
      expect(dummy2).toBe(0);

      expect(fnSpy).toHaveBeenCalledTimes(4);
    });

    it('should observed nested data', () => {
      const original = new Map();
      const observed = reactive(original);
      observed.set('key', { a: 1 });

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      let dummy = traceRef.value.get('key').a;
      expect(dummy).toBe(1);

      observed.get('key').a = 2;
      dummy = traceRef.value.get('key').a;
      expect(dummy).toBe(2);

      expect(fnSpy).toHaveBeenCalledTimes(1);
    });

    it('should observe nested values in iterations (forEach)', () => {
      const original = new Map([[1, { foo: 1 }]]);
      const map = reactive(original);

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
      map.get(1)!.foo++;
      expect(cal()).toBe(2);

      expect(fnSpy).toHaveBeenCalledTimes(1);
    });

    it('should observe nested values in iterations (values)', () => {
      const original = new Map([[1, { foo: 1 }]]);
      const map = reactive(original);

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
      map.get(1)!.foo++;
      expect(cal()).toBe(2);

      expect(fnSpy).toHaveBeenCalledTimes(1);
    });

    it('should observe nested values in iterations (entries)', () => {
      const key = {};
      const original = new Map([[key, { foo: 1 }]]);
      const map = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      const cal = () => {
        let dummy = 0;
        for (const [key, value] of traceRef.value.entries()) {
          key;
          expect(isReactive(key)).toBe(true);
          expect(isReactive(value)).toBe(true);
          dummy += value.foo;
        }
        return dummy;
      };

      expect(cal()).toBe(1);
      map.get(key)!.foo++;
      expect(cal()).toBe(2);

      expect(fnSpy).toHaveBeenCalledTimes(1);
    });

    it('should observe nested values in iterations (for...of)', () => {
      const key = {};
      const original = new Map([[key, { foo: 1 }]]);
      const map = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      const cal = () => {
        let dummy = 0;
        for (const [key, value] of traceRef.value) {
          key;
          expect(isReactive(key)).toBe(true);
          expect(isReactive(value)).toBe(true);
          dummy += value.foo;
        }
        return dummy;
      };

      expect(cal()).toBe(1);
      map.get(key)!.foo++;
      expect(cal()).toBe(2);

      expect(fnSpy).toHaveBeenCalledTimes(1);
    });
  });
});
