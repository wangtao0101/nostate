import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { useSetup } from '../useSetup';
import { reducer } from '../reducer';
import { reactive } from '../../reactivity';
import { create, listenersMap } from '../create';

describe('core/setup global setup', () => {
  it('should rerender when change reactive value when use global nostate', () => {
    const setup = create((a: number) => {
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
      const { observed, increase } = useSetup(setup);

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

  // it('should rerender when change reactive value when use global nostate', () => {
  //   const setup = create((a: number) => {
  //     const observed = reactive({ foo: a });
  //     return {
  //       observed,
  //       increase: reducer(() => {
  //         // triger mutiple action
  //         observed.foo += 1;
  //         observed.foo -= 1;
  //         observed.foo += 1;
  //       }),
  //     };
  //   }, 1);

  //   const Example = () => {
  //     const { observed, increase } = useSetup(setup);

  //     return (
  //       <div data-testid="id" onClick={() => increase()}>
  //         {observed.foo}
  //       </div>
  //     );
  //   };

  //   const Example1 = () => {
  //     useSetup(setup);
  //     console.log('adfasdfad')
  //     return <div />;
  //   };

  //   const { getByTestId, queryByText } = render(
  //     <div>
  //       <Example />
  //       <Example1 />
  //     </div>
  //   );
  //   expect(queryByText('1')).not.toBeNull();
  //   console.log('afdasdfcccccccc')
  //   const node = getByTestId('id');
  //   fireEvent(node, new MouseEvent('click', { bubbles: true, cancelable: false }));
  //   expect(queryByText('2')).not.toBeNull();
  // });

  it('should untap listener when component destroy', () => {
    const setupFn = () => {
      const observed = reactive({ foo: 1 });
      return {
        observed,
      };
    };

    const setup = create(setupFn);

    const Example = () => {
      const { observed } = useSetup(setup);

      return <div data-testid="id">{observed.foo}</div>;
    };

    const { queryByText, unmount } = render(<Example />);
    expect(queryByText('1')).not.toBeNull();

    expect(listenersMap.get(setup as any)!.length).toBe(1);
    unmount();
    expect(listenersMap.get(setup as any)!.length).toBe(0);
  });

  it('should rerender all instance when change reactive value when use global nostate', () => {
    const setup = create(() => {
      const observed = reactive({ foo: 1 });
      return {
        observed,
        increase: reducer(() => {
          observed.foo += 1;
        }),
      };
    });

    const Example1 = () => {
      const { observed, increase } = useSetup(setup);

      return (
        <div data-testid="id" onClick={() => increase()}>
          {observed.foo}
        </div>
      );
    };

    const Example2 = () => {
      const { observed } = useSetup(setup);

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

    const setup = create(() => {
      const observed = reactive({ foo: 1 });
      return {
        observed,
        increase: reducer(() => {
          observed.foo += 1;
        }),
      };
    });

    const Child = () => {
      const { observed, increase } = useSetup(setup);

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
      const { observed } = useSetup(setup);

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
