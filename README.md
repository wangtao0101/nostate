# nostate
[![Github action Status](https://github.com/wangtao0101/nostate/workflows/build/badge.svg)](https://github.com/wangtao0101/nostate/actions)
[![Coverage Status](https://coveralls.io/repos/github/wangtao0101/nostate/badge.svg)](https://coveralls.io/github/wangtao0101/nostate)
[![npm](https://img.shields.io/npm/v/nostate.svg?label=)](https://www.npmjs.com/package/nostate)

Simple state management for react.

## Installation

```
npm install nostate --save
yarn add nostate
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
import { reactive, reducer } from 'nostate';

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
  const { state, increase, asyncIncrease } = useSetup(setup);

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
import { reactive, reducer, create } from 'nostate';

// create will run wrap function immediately
export const setup = create(() => {
  const state = reactive({ count: 0 });

  const increase = reducer((num: number) => {
    state.count += num;
  });

  return {
    state,
    increase
  };
});

export function App() {
  const { state, increase } = useSetup(setup);

  return (
    <div>
      <h1>Global Bpp: {state.count}</h1>
      <button onClick={() => increase(1)}>+</button>
    </div>
  );
}
```

## API

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
