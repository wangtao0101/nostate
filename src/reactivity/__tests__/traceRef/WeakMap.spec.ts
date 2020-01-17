import { reactive, isReactive, reactiveTrace } from '../../index';
import { unlockValue, lockValue } from '../../lock';

describe('reactivity/collections', () => {
  describe('WeakMap', () => {
    beforeAll(() => {
      unlockValue();
    });

    afterAll(() => {
      lockValue();
    });

    test('instanceof', () => {
      const original = new WeakMap();
      const traceRef = reactiveTrace(original, () => {});
      expect(isReactive(traceRef.value)).toBe(true);
      expect(original instanceof WeakMap).toBe(true);
      expect(traceRef.value instanceof WeakMap).toBe(true);
    });

    it('should observe mutations', () => {
      const original = new WeakMap();
      const key = {};
      const map = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      const cal = () => {
        return traceRef.value.get(key);
      };

      expect(cal()).toBe(undefined);
      map.set(key, 'value');
      expect(cal()).toBe('value');
      map.set(key, 'value2');
      expect(cal()).toBe('value2');
      map.delete(key);
      expect(cal()).toBe(undefined);

      expect(fnSpy).toHaveBeenCalledTimes(3);
    });

    it('should observed nested data', () => {
      const original = new WeakMap();
      const key = {};
      const observed = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      observed.set(key, { a: 1 });

      const cal = () => {
        return traceRef.value.get(key).a;
      };

      expect(cal()).toBe(1);

      observed.get(key).a = 2;
      expect(cal()).toBe(2);

      expect(fnSpy).toHaveBeenCalledTimes(1);
    });
  });
});
