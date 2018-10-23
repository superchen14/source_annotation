import $$observable from 'symbol-observable'
import ActionTypes from './utils/actionTypes'
import isPlainObject from './utils/isPlainObject'

// enhancer参数必须由applyMiddleware调用生成
export default function createStore(reducer, preloadedState, enhancer) {
  // 相当于提供重载函数createStore(reducer, enhancer)
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState
    preloadedState = undefined
  }

  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') { throw new Error('enhancer必须是函数') }

    // 如果enhancer存在，用它对createStore返回的dispatch接口进行扩展，并将扩展后的dispatch接口返回给用户
    // 如何拓展可以查看applyMiddleware.js的逻辑
    return enhancer(createStore)(reducer, preloadedState)
  }

  if (typeof reducer !== 'function') { throw new Error('reducer必须是函数') }

  let currentReducer = reducer
  let currentState = preloadedState
  let currentListeners = []
  let nextListeners = currentListeners
  let isDispatching = false

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice()
    }
  }

  // 返回由redux托管的state
  function getState() {
    if (isDispatching) { throw new Error('reducer正在计算新的state时，不能获取state') }
    return currentState
  }

  // 添加一个对state变化的监听函数
  function subscribe(listener) {
    if (typeof listener !== 'function') { throw new Error('listener必须是一个函数') }
    if (isDispatching) { throw new Error( 'reducer正在计算新的state时，不能添加监听') }

    let isSubscribed = true

    // 如果在dispatch完成时，添了一个新的监听。
    // 我们需要保证该监听不在currentListeners中，并且在nextListeners中
    ensureCanMutateNextListeners()
    nextListeners.push(listener)

    return function unsubscribe() {
      if (!isSubscribed) { return }
      if (isDispatching) { throw new Error( 'reducer正在计算新的state时，不能取消监听') }

      isSubscribed = false

      // 如果在dispatch完成时，取消了一个监听。
      // 我们需要保证该监听依然在currentListeners中，并且不在nextListeners中
      ensureCanMutateNextListeners()
      const index = nextListeners.indexOf(listener)
      nextListeners.splice(index, 1)
    }
  }

  // dispatch是redux机制中修改state的唯一接口
  function dispatch(action) {
    // 错误处理的逻辑
    if (!isPlainObject(action)) { throw new Error( 'action必须是plain object') }
    if (typeof action.type === 'undefined') { throw new Error( 'Action.type必须被定义') }

    // 如果isDispatching为true，说明currentReducer正在处理一个action，因此不能处理新的action
    if (isDispatching) { throw new Error('Reducers may not dispatch actions.') }

    try {
      // 处理当前action前，需要将isDispatching设置为true用来拒绝新的action
      isDispatching = true
      // 根据action以及预定的reducer计算新的state
      currentState = currentReducer(currentState, action)
    } finally {
      // 处理完当前action后，需要将isDispatching设置为false用来接收新的action
      isDispatching = false
    }

    // state改变后通知所有监听者
    const listeners = (currentListeners = nextListeners)
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i]
      listener()
    }

    return action
  }

  // 更改reducer的接口
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.')
    }

    currentReducer = nextReducer
    dispatch({ type: ActionTypes.REPLACE })
  }

  // 省略 observable
  function observable() {
    const outerSubscribe = subscribe
    return {
      subscribe(observer) {
        if (typeof observer !== 'object' || observer === null) {
          throw new TypeError('Expected the observer to be an object.')
        }

        function observeState() {
          if (observer.next) {
            observer.next(getState())
          }
        }

        observeState()
        const unsubscribe = outerSubscribe(observeState)
        return { unsubscribe }
      },

      [$$observable]() {
        return this
      }
    }
  }

  dispatch({ type: ActionTypes.INIT })

  return {
    dispatch,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable
  }
}
