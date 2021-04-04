import React, { useMemo, useReducer } from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { reducer } from '../reducer';
import { reactive, computed } from '../../reactivity';
import { useCreateSetup } from '../useCreateSetup';
import { useSetupBinds } from '../useSetupBinds';

describe('core/component', () => {
  it('should rerender when change reactive value', () => {
    const Example = () => {
      const setupBinds = useCreateSetup(
        (a: number, b: number) => {
          const observed = reactive({ foo: 1 });
          return {
            observed,
            increase: reducer(() => {
              observed.foo += a + b;
            }),
          };
        },
        0.5,
        0.5
      );

      const { observed, increase } = useSetupBinds(setupBinds);

      return (
        <div data-testid="id" onClick={() => increase()}>
          {observed.foo}
        </div>
      );
    };

    const { getByTestId, queryByText } = render(<Example />);
    expect(queryByText('1')).not.toBeNull();

    const node = getByTestId('id');
    fireEvent(node, new MouseEvent('click', { bubbles: true, cancelable: false }));
    expect(queryByText('2')).not.toBeNull();
  });

  it('should rerender when passed nest observed value', () => {
    const Example = () => {
      const setupBinds = useCreateSetup(() => {
        const observed = reactive({ foo: { bar: 1 } });
        return {
          observed: observed.foo,
          increase: reducer(() => {
            observed.foo.bar += 1;
          }),
        };
      });

      const { observed, increase } = useSetupBinds(setupBinds);

      return (
        <div data-testid="id" onClick={() => increase()}>
          {observed.bar}
        </div>
      );
    };

    const { getByTestId, queryByText } = render(<Example />);
    expect(queryByText('1')).not.toBeNull();

    const node = getByTestId('id');
    fireEvent(node, new MouseEvent('click', { bubbles: true, cancelable: false }));
    expect(queryByText('2')).not.toBeNull();
  });

  it('should rerender when change reactive value', () => {
    const Example = () => {
      const setupBinds = useCreateSetup(() => {
        const observed = reactive({ foo: 1 });
        const cValue = computed(() => observed.foo + 1);
        return {
          cValue,
          increase: reducer(() => {
            observed.foo += 1;
          }),
        };
      });

      const { cValue, increase } = useSetupBinds(setupBinds);

      return (
        <div data-testid="id" onClick={() => increase()}>
          {cValue.value}
        </div>
      );
    };

    const { getByTestId, queryByText } = render(<Example />);
    expect(queryByText('2')).not.toBeNull();

    const node = getByTestId('id');
    fireEvent(node, new MouseEvent('click', { bubbles: true, cancelable: false }));
    expect(queryByText('3')).not.toBeNull();
  });

  it('should rerender one time if value changed twice in one reducer', () => {
    const fn = jest.fn();

    const Example = () => {
      const setupBinds = useCreateSetup(() => {
        const observed = reactive({ foo: 1 });
        return {
          observed,
          increase: reducer(() => {
            observed.foo += 1;
            observed.foo += 1;
          }),
        };
      });

      const { observed, increase } = useSetupBinds(setupBinds);

      fn();

      return (
        <div data-testid="id" onClick={() => increase()}>
          {observed.foo}
        </div>
      );
    };

    const { getByTestId } = render(<Example />);

    const node = getByTestId('id');
    fireEvent(node, new MouseEvent('click', { bubbles: true, cancelable: false }));

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should trigger render bothparent and child if pass reactive to child when value changed', () => {
    const Child = ({ observed, increase }: any) => {
      return (
        <div data-testid="id" onClick={() => increase()}>
          {observed.foo}
        </div>
      );
    };

    const Parent = () => {
      const setupBinds = useCreateSetup(() => {
        const observed = reactive({ foo: 1 });
        return {
          observed,
          increase: reducer(() => {
            observed.foo += 1;
          }),
        };
      });

      const { observed, increase } = useSetupBinds(setupBinds);

      return <Child observed={observed} increase={increase} />;
    };

    const { getByTestId, queryByText } = render(<Parent />);
    expect(queryByText('1')).not.toBeNull();

    const node = getByTestId('id');
    fireEvent(node, new MouseEvent('click', { bubbles: true, cancelable: false }));
    expect(queryByText('2')).not.toBeNull();
  });

  it('should trigger useMemo when nested value change', () => {
    const Parent = () => {
      const setupBinds = useCreateSetup(() => {
        const observed = reactive({ foo: { foo: 1 } });
        return {
          observed,
          increase: reducer(() => {
            observed.foo.foo += 1;
          }),
        };
      });

      const { observed, increase } = useSetupBinds(setupBinds);

      const v = useMemo(() => observed.foo.foo, [observed.foo]);

      return (
        <div data-testid="id" onClick={() => increase()}>
          {v}
        </div>
      );
    };

    const { getByTestId, queryByText } = render(<Parent />);
    expect(queryByText('1')).not.toBeNull();

    const node = getByTestId('id');
    fireEvent(node, new MouseEvent('click', { bubbles: true, cancelable: false }));
    expect(queryByText('2')).not.toBeNull();
  });

  it('should get immutable state', () => {
    let observed1: any;
    let observed2;
    const Example = () => {
      const setupBinds = useCreateSetup(() => {
        const observed = reactive({ foo: 1 });
        return {
          observed: observed,
          increase: reducer(() => {
            observed.foo += 1;
          }),
        };
      });

      const { observed, increase } = useSetupBinds(setupBinds);
      if (observed1) {
        observed2 = observed;
      } else {
        observed1 = observed;
      }

      return (
        <div data-testid="id" onClick={() => increase()}>
          {observed.foo}
        </div>
      );
    };

    const { getByTestId, queryByText } = render(<Example />);
    expect(queryByText('1')).not.toBeNull();

    const node = getByTestId('id');
    fireEvent(node, new MouseEvent('click', { bubbles: true, cancelable: false }));
    expect(observed1).not.toBe(observed2);
  });

  it('should get same state', () => {
    let observed1: any;
    let observed2;
    const fn = jest.fn();

    const Example = () => {
      const setupBinds = useCreateSetup(() => {
        const observed = reactive({ foo: 1 });
        return {
          observed: observed,
        };
      });

      const [, forceRender] = useReducer((s) => s + 1, 0);

      const { observed } = useSetupBinds(setupBinds);
      if (observed1) {
        observed2 = observed;
      } else {
        observed1 = observed;
      }
      fn();

      return (
        <div data-testid="id" onClick={() => forceRender()}>
          {observed.foo}
        </div>
      );
    };

    const { getByTestId } = render(<Example />);

    const node = getByTestId('id');
    fireEvent(node, new MouseEvent('click', { bubbles: true, cancelable: false }));
    expect(fn).toBeCalledTimes(2);
    expect(observed1).toBe(observed2);
  });
});
