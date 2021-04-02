import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { useSetupBinds } from '../useSetupBinds';
import { reducer } from '../reducer';
import { reactive } from '../../reactivity';
import { createSetup } from '../createSetup';

describe('core/useSetupBinds', () => {
  it('should rerender when change reactive value when use global nostate', () => {
    const setup = createSetup((a: number) => {
      const observed = reactive({ foo: a });
      return {
        observed,
        increase: reducer(() => {
          // triger mutiple action
          observed.foo += 1;
          observed.foo -= 1;
          observed.foo += 1;
        }),
      };
    }, 1);

    const Example = () => {
      const { observed, increase } = useSetupBinds(setup);

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

  it('should rerender target component', () => {
    const setup = createSetup((a: number) => {
      const observed = reactive({ foo: a });
      return {
        observed,
        increase: reducer(() => {
          observed.foo += 1;
        }),
      };
    }, 1);

    const fn1 = jest.fn();
    const fn2 = jest.fn();

    const Example = () => {
      const { observed, increase } = useSetupBinds(setup);
      fn1();
      return (
        <div data-testid="id" onClick={() => increase()}>
          {observed.foo}
        </div>
      );
    };

    const Example1 = () => {
      fn2();
      useSetupBinds(setup);
      return <div />;
    };

    const { getByTestId } = render(
      <div>
        <Example />
        <Example1 />
      </div>
    );
    const node = getByTestId('id');
    expect(fn1).toBeCalledTimes(1);
    expect(fn2).toBeCalledTimes(1);
    fireEvent(node, new MouseEvent('click', { bubbles: true, cancelable: false }));
    expect(fn1).toBeCalledTimes(2);
    expect(fn2).toBeCalledTimes(1);
  });

  it('should rerender all instance when change reactive value when use global nostate', () => {
    const setup = createSetup(() => {
      const observed = reactive({ foo: 1 });
      return {
        observed,
        increase: reducer(() => {
          observed.foo += 1;
        }),
      };
    });

    const Example1 = () => {
      const { observed, increase } = useSetupBinds(setup);

      return (
        <div data-testid="id" onClick={() => increase()}>
          {observed.foo}
        </div>
      );
    };

    const Example2 = () => {
      const { observed } = useSetupBinds(setup);

      return <div>{observed.foo + 10}</div>;
    };

    const { getByTestId, queryByText } = render(
      <div>
        <Example1 />
        <Example2 />
      </div>
    );
    expect(queryByText('1')).not.toBeNull();
    expect(queryByText('11')).not.toBeNull();

    const node = getByTestId('id');
    fireEvent(node, new MouseEvent('click', { bubbles: true, cancelable: false }));
    expect(queryByText('2')).not.toBeNull();
    expect(queryByText('12')).not.toBeNull();
  });

  it('Parent should render before child, and all element should only render once', () => {
    let shouldCollect = false;
    const collect: number[] = [];

    const setup = createSetup(() => {
      const observed = reactive({ foo: 1 });
      return {
        observed,
        increase: reducer(() => {
          observed.foo += 1;
        }),
      };
    });

    const Child = () => {
      const { observed, increase } = useSetupBinds(setup);

      if (shouldCollect) {
        collect.push(2);
      }

      return (
        <div data-testid="id" onClick={() => increase()}>
          {observed.foo}
        </div>
      );
    };

    const Parent = () => {
      const { observed } = useSetupBinds(setup);

      if (shouldCollect) {
        collect.push(1);
      }

      return (
        <div>
          <Child />
          {observed.foo + 10}
        </div>
      );
    };

    const { getByTestId, queryByText } = render(
      <>
        <Parent />
      </>
    );
    expect(queryByText('1')).not.toBeNull();
    expect(queryByText('11')).not.toBeNull();

    shouldCollect = true;

    const node = getByTestId('id');
    fireEvent(node, new MouseEvent('click', { bubbles: true, cancelable: false }));
    expect(queryByText('2')).not.toBeNull();
    expect(queryByText('12')).not.toBeNull();
    expect(collect).toEqual([1, 2]);
  });
});
