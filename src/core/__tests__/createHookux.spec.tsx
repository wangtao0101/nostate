import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { useHookux } from '../component/useHookux';
import { reducer } from '../reducer';
import { reactive } from '../../reactivity';
import { Provider } from '../component/provider';
import { createGlobalHookux, createLocalHookux } from '../createHookux';
import { createStore } from '../createStore';

const setup = createGlobalHookux(
  () => {
    const observed = reactive({ foo: 1 });
    return {
      observed,
      increase: reducer(() => {
        // triger mutiple action
        observed.foo += 1;
        observed.foo -= 1;
        observed.foo += 1;
      })
    };
  },
  'a',
  'b'
);

describe('core/createGlobalHookux', () => {
  it('should rerender when change reactive value when use global hookux', () => {
    const Example = () => {
      const { observed, increase } = useHookux(setup);

      return (
        <div data-testid="id" onClick={() => increase()}>
          {observed.foo}
        </div>
      );
    };

    const store = createStore();

    const { getByTestId, queryByText } = render(
      <Provider store={store}>
        <Example />
      </Provider>
    );
    expect(queryByText('1')).not.toBeNull();

    const node = getByTestId('id');
    fireEvent(node, new MouseEvent('click', { bubbles: true, cancelable: false }));
    expect(queryByText('2')).not.toBeNull();
  });

  it('should rerender all instance when change reactive value when use global hookux', () => {
    const Example1 = () => {
      const { observed, increase } = useHookux(setup);

      return (
        <div data-testid="id" onClick={() => increase()}>
          {observed.foo}
        </div>
      );
    };

    const Example2 = () => {
      const { observed } = useHookux(setup);

      return <div>{observed.foo + 10}</div>;
    };

    const store = createStore();

    const { getByTestId, queryByText } = render(
      <Provider store={store}>
        <Example1 />
        <Example2 />
      </Provider>
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

    const Child = () => {
      const { observed, increase } = useHookux(setup);

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
      const { observed } = useHookux(setup);

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

    const store = createStore();

    const { getByTestId, queryByText } = render(
      <Provider store={store}>
        <Parent />
      </Provider>
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

describe('core/createLocalHookux', () => {
  it('should rerender when change reactive value when use global hookux', () => {
    const setupLocal = createLocalHookux(
      () => {
        const observed = reactive({ foo: 1 });
        return {
          observed,
          increase: reducer(() => {
            observed.foo += 1;
          })
        };
      },
      'a',
      'b'
    );

    const Example = () => {
      const { observed, increase } = useHookux(setupLocal);

      return (
        <div data-testid="id" onClick={() => increase()}>
          {observed.foo}
        </div>
      );
    };

    const store = createStore();

    const { getByTestId, queryByText } = render(
      <Provider store={store}>
        <Example />
      </Provider>
    );
    expect(queryByText('1')).not.toBeNull();

    const node = getByTestId('id');
    fireEvent(node, new MouseEvent('click', { bubbles: true, cancelable: false }));
    expect(queryByText('2')).not.toBeNull();
  });
});
