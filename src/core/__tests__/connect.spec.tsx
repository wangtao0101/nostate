import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { reducer } from '../reducer';
import { reactive } from '../../reactivity';
import { create } from '../create';
import { connect } from '../connect';

const localSetup = () => {
  const observed = reactive({ foo: 1 });
  return {
    observed,
    increase: reducer(() => {
      observed.foo += 1;
    })
  };
};

describe('core/connect', () => {
  it('should rerender class component when change reactive value', () => {
    const globalSetup = create(localSetup);

    interface Props {
      setup: ReturnType<typeof globalSetup>;
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

  it('should support connect both local setup and global setup same time', () => {
    const globalSetup = create(localSetup);

    interface Props {
      globalSetup: ReturnType<typeof globalSetup>;
      localSetup: ReturnType<typeof localSetup>;
      b: string;
    }

    class Example extends React.Component<Props> {
      render() {
        const { observed, increase } = this.props.globalSetup;
        return (
          <div>
            <div data-testid="id1" onClick={() => increase()}>
              {observed.foo}
            </div>
            <div data-testid="id2" onClick={() => this.props.localSetup.increase()}>
              {this.props.localSetup.observed.foo}
            </div>
          </div>
        );
      }
    }

    const Connected = connect({ globalSetup: globalSetup, localSetup: localSetup })(Example);

    const { getByTestId, queryAllByText, unmount } = render(<Connected b="111" />);
    expect(queryAllByText('1').length).toBe(2);

    const node = getByTestId('id1');
    fireEvent(node, new MouseEvent('click', { bubbles: true, cancelable: false }));
    expect(queryAllByText('2')).not.toBe(1);

    const node1 = getByTestId('id2');
    fireEvent(node1, new MouseEvent('click', { bubbles: true, cancelable: false }));
    expect(queryAllByText('2')).not.toBe(2);

    unmount();
  });

  it('should support connect two same local setup', () => {
    interface Props {
      other: ReturnType<typeof localSetup>;
      localSetup: ReturnType<typeof localSetup>;
    }

    class Example1 extends React.Component<Props> {
      render() {
        const { observed, increase } = this.props.other;
        return (
          <div>
            <div data-testid="id3" onClick={() => increase()}>
              {observed.foo}
            </div>
            <div data-testid="id4" onClick={() => this.props.localSetup.increase()}>
              {this.props.localSetup.observed.foo}
            </div>
          </div>
        );
      }
    }

    const Connected = connect({ other: localSetup, localSetup: localSetup })(Example1);

    const { getByTestId, queryAllByText } = render(<Connected />);
    expect(queryAllByText('1').length).toBe(2);

    const node = getByTestId('id3');
    fireEvent(node, new MouseEvent('click', { bubbles: true, cancelable: false }));
    expect(queryAllByText('2')).not.toBe(1);

    const node1 = getByTestId('id4');
    fireEvent(node1, new MouseEvent('click', { bubbles: true, cancelable: false }));
    expect(queryAllByText('2')).not.toBe(2);
  });

  it('should support forwardRef', () => {
    interface Props {
      localSetup: ReturnType<typeof localSetup>;
    }

    const fn = jest.fn();

    class Example1 extends React.Component<Props> {
      fn: any;
      constructor(props: any) {
        super(props);
        this.fn = fn;
      }

      render() {
        const { observed, increase } = this.props.localSetup;
        return (
          <div>
            <div data-testid="id3" onClick={() => increase()}>
              {observed.foo}
            </div>
          </div>
        );
      }
    }

    const Connected = connect(
      { localSetup: localSetup },
      { forwardRef: true }
    )(Example1);

    const ref = React.createRef<any>();
    const { queryAllByText } = render(<Connected ref={ref} />);
    expect(queryAllByText('1').length).toBe(1);

    ref.current.fn();

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
