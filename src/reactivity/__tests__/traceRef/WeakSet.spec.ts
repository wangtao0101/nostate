import { reactive, isReactive, reactiveTrace } from '../../index';
import { unlockValue, lockValue } from '../../lock';

describe('reactivity/collections', () => {
  describe('WeakSet', () => {
    beforeAll(() => {
      unlockValue();
    });

    afterAll(() => {
      lockValue();
    });

    it('instanceof', () => {
      const original = new WeakSet();
      const traceRef = reactiveTrace(original, () => {});
      expect(isReactive(traceRef.value)).toBe(true);
      expect(original instanceof WeakSet).toBe(true);
      expect(traceRef.value instanceof WeakSet).toBe(true);
    });

    it('should observe mutations', () => {
      const original = new WeakSet();
      const set = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      const value = {};
      const cal = () => {
        return traceRef.value.has(value);
      };

      expect(cal()).toBe(false);
      set.add(value);
      expect(cal()).toBe(true);
      set.delete(value);
      expect(cal()).toBe(false);

      expect(fnSpy).toHaveBeenCalledTimes(2);
    });

    it('should observe mutations with observed value', () => {
      const original = new WeakSet();
      const set = reactive(original);

      const fnSpy = jest.fn(() => {});
      const traceRef = reactiveTrace(original, fnSpy);

      const value = reactive({});
      const cal = () => {
        return traceRef.value.has(value);
      };

      expect(cal()).toBe(false);
      set.add(value);
      expect(cal()).toBe(true);
      set.delete(value);
      expect(cal()).toBe(false);

      expect(fnSpy).toHaveBeenCalledTimes(2);
    });
  });
});
