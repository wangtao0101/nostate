import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { useHookux } from '../component/useHookux';
import { reducer } from '../reducer';
import { reactive } from '../../reactivity';
import { Provider } from '../component/provider';
import { createGlobalHookux } from '../createHookux';
import { createStore } from '../createStore';

const setup = createGlobalHookux(
  () => {
    const observed = reactive({ foo: 1 });
    return {
      observed,
      increase: reducer(() => {
        // trigger mutiple action
        observed.foo += 1;
        observed.foo -= 1;
        observed.foo += 1;
      })
    };
  },
  'a',
  'b'
);

describe('core/createStore', () => {
  it('should getState and getAllState from store', () => {
    const store = createStore();

    expect(store.isMounted(setup)).toBe(false);

    store.mount(setup);
    const fn = jest.fn();
    store.subscribe(setup, fn);

    expect(store.isMounted(setup)).toBe(true);

    expect(store.getState(setup).observed.foo).toBe(1);

    store.getState(setup).increase();
    expect(fn).toBeCalledTimes(3);
    expect(store.getState(setup).observed.foo).toBe(2);

    expect(store.getAllState().a.b.observed.foo).toBe(2);
  });

  it('should getState and getAllState from store in component', () => {
    const Example = () => {
      const { observed, increase } = useHookux(setup);

      return (
        <div data-testid="id" onClick={() => increase()}>
          {observed.foo}
        </div>
      );
    };

    const store = createStore();

    expect(store.isMounted(setup)).toBe(false);

    const { queryByText } = render(
      <Provider store={store}>
        <Example />
      </Provider>
    );

    expect(store.isMounted(setup)).toBe(true);
    expect(queryByText('1')).not.toBeNull();

    expect(store.getState(setup).observed.foo).toBe(1);

    store.getState(setup).increase();
    expect(queryByText('2')).not.toBeNull();
    expect(store.getState(setup).observed.foo).toBe(2);

    expect(store.getAllState().a.b.observed.foo).toBe(2);
  });
});
