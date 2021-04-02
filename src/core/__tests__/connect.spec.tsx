import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { reducer } from '../reducer';
import { reactive } from '../../reactivity';
import { createSetup } from '../createSetup';
import { connect } from '../connect';

const localSetup = () => {
  const observed = reactive({ foo: 1 });
  return {
    observed,
    increase: reducer(() => {
      observed.foo += 1;
    }),
  };
};

describe('core/connect', () => {
  it('should rerender class component when change reactive value', () => {
    const globalSetup = createSetup(localSetup);

    interface Props {
      setup: typeof globalSetup.binds;
      b: string;
    }

    class Example extends React.Component<Props> {
      render() {
        const { observed, increase } = this.props.setup;
        return (
          <div data-testid="id" onClick={() => increase()}>
            {observed.foo}
          </div>
        );
      }
    }

    const Connected = connect({ setup: globalSetup })(Example);

    const { getByTestId, queryByText } = render(<Connected b="111" />);
    expect(queryByText('1')).not.toBeNull();

    const node = getByTestId('id');
    fireEvent(node, new MouseEvent('click', { bubbles: true, cancelable: false }));
    expect(queryByText('2')).not.toBeNull();
  });

  it('should support forwardRef', () => {
    const globalSetup = createSetup(localSetup);
    interface Props {
      setup: typeof globalSetup.binds;
    }

    const fn = jest.fn();

    class Example1 extends React.Component<Props> {
      fn: any;
      constructor(props: any) {
        super(props);
        this.fn = fn;
      }

      render() {
        const { observed, increase } = this.props.setup;
        return (
          <div>
            <div data-testid="id3" onClick={() => increase()}>
              {observed.foo}
            </div>
          </div>
        );
      }
    }

    const Connected = connect({ setup: globalSetup }, { forwardRef: true })(Example1);

    const ref = React.createRef<any>();
    const { queryAllByText } = render(<Connected ref={ref} />);
    expect(queryAllByText('1').length).toBe(1);

    ref.current.fn();

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
