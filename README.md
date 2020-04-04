# hookux

Simple state management for react.

## Installation

```
npm install hookux --save
yarn add hookux
```

## Motivation

This lib is motived by Vue 3 Composition API and redux. There are many disadvantages using
the pure Vue 3 Composition API in react. So I introduce the predictability from redux and immutable
feature in Composition API.
Currently the immutable feature is not fully realized, it is more proper to say the state is unchangeable now, and the fully immutable feature will be like immer and be finished in the version.

## Features

- state is immutable
- state is predictable like redux
- No boilerplate code
- Fully typescirpt
- Easy learn, easy write, easy test

## Example

[count](https://codesandbox.io/s/bold-sanderson-cshtw)

## Usage

Component scope state.

> Every component has independent state when they use the same setup

```js
import { reactive, reducer } from 'hookux';

const sleep = () => {
  return new Promise(resolve => {
    setTimeout(resolve, 2000);
  });
};

export const setup = () => {
  const state = reactive({ count: 0 });

  // state can only change in reducer
  const increase = reducer((num: number) => {
    state.count += num;
  });

  // async function and commit data use reducer
  const asyncIncrease = async (num: number) => {
    await sleep();
    increase(num);
  };

  return {
    state,
    increase,
    asyncIncrease
  };
};

export function App() {
  // state is immutable here
  const { state, increase, asyncIncrease } = useHookux(setup);

  return (
    <div>
      <h1>Global Bpp: {state.count}</h1>
      <button onClick={() => increase(1)}>+</button>
      <button onClick={() => asyncIncrease(2)}>async+</button>
    </div>
  );
}
```

Global scope state

> Every component has same state when they use the global setup

```js
import { reactive, reducer } from 'hookux';

export const setup = createGlobalHookux(
  () => {
    const state = reactive({ count: 0 });

    const increase = reducer((num: number) => {
      state.count += num;
    });

    return {
      state,
      increase
    };
  },
  // you can touch the return data of global setup by store.module.setup
  'module',
  'setup'
);

export function App() {
  const { state, increase } = useHookux(setup);

  return (
    <div>
      <h1>Global Bpp: {state.count}</h1>
      <button onClick={() => increase(1)}>+</button>
    </div>
  );
}
```

## API

### createStore and Provider

```js
const store = createStore();

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById("root") as HTMLElement
);
```

### reactive

```js
const original: any = { foo: 1 };
const observed = reactive(original);
observed.foo++;
console.log(original.foo); // 2
```

### computed

```js
const value = reactive<{ foo?: number }>({});
const cValue = computed(() => value.foo);
expect(cValue.value).toBe(undefined);
value.foo = 1;
expect(cValue.value).toBe(1);
```

### reducer

> state can only change in function wrapped by reducer

```js
const increase = reducer((num: number) => {
  state.count += num;
});
```
