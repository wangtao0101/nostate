import { renderHook, act } from '@testing-library/react-hooks';
import { useHux } from '../useHux';
import { reactive, computed } from '../../reactivity';
import { reducer } from '../reducer';

describe('core/useHux', () => {
  it('should update reactive value', () => {
    const { result } = renderHook(() =>
      useHux(() => {
        const observed = reactive({ foo: 1 });
        return {
          observed,
          increase: reducer(() => {
            observed.foo += 1;
          })
        };
      }, {})
    );

    const { observed, increase } = result.current;

    expect(observed.foo).toBe(1);

    act(() => {
      increase();
    });

    expect(observed.foo).toBe(2);
  });

  it('should update computed value', () => {
    const { result } = renderHook(() =>
      useHux(() => {
        const observed = reactive({ foo: 1 });

        const cValue = computed(() => observed.foo + 1);
        return {
          cValue,
          increase: reducer(() => {
            observed.foo += 1;
          })
        };
      }, {})
    );

    const { cValue, increase } = result.current;

    expect(cValue.value).toBe(2);

    act(() => {
      increase();
    });

    expect(cValue.value).toBe(3);
  });

  it('should pass init props', () => {
    const { result } = renderHook(() =>
      useHux(
        ({ a }: { a: number }) => {
          const observed = reactive({ foo: a });

          return {
            observed
          };
        },
        { a: 2 }
      )
    );

    const { observed } = result.current;

    expect(observed.foo).toBe(2);
  });
});
