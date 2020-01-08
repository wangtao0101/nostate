import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { useHux } from '../useHux';
import { reducer } from '../reducer';
import { reactive, computed } from '../../reactivity';

describe('core/component', () => {
  it('should test react component success', () => {
    const Text = ({ text }: { text: string }) => <span>{text}</span>;

    const { queryByText } = render(<Text text={'text'} />);

    expect(queryByText('text')).not.toBeNull();
  });

  it('should rerender when change reactive value', () => {
    const Example = () => {
      const { observed, increase } = useHux(() => {
        const observed = reactive({ foo: 1 });
        return {
          observed,
          increase: reducer(() => {
            observed.foo += 1;
          })
        };
      }, {});

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

  it('should rerender when change reactive value', () => {
    const Example = () => {
      const { cValue, increase } = useHux(() => {
        const observed = reactive({ foo: 1 });
        const cValue = computed(() => observed.foo + 1);
        return {
          cValue,
          increase: reducer(() => {
            observed.foo += 1;
          })
        };
      }, {});

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
      const { observed, increase } = useHux(() => {
        const observed = reactive({ foo: 1 });
        return {
          observed,
          increase: reducer(() => {
            observed.foo += 1;
            observed.foo += 1;
          })
        };
      }, {});

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
});
