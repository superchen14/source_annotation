import compose from './compose'

// createStore返回redux约定的接口如dispatch，subscribe, getState等，applyMiddleware是对createStore的一个修饰
// 修饰后的createStore即 "applyMiddleware(m1, m2, m3)(createStore)" 依然接受相同的参数返回约定的接口
// 但是已经用中间件链对原始的dispatch接口进行了改造
// 因此用户调用改造后的dispatch发送一个action时，每个中间件都有机会截获这个action并处理，然后传给下一个中间件直到最后交给原始的dispatch
export default function applyMiddleware(...middlewares) {
  return createStore => (...args) => {
    const store = createStore(...args)

    // 这个dispatch变量之后会被重新赋值为中间件修饰后的dispatch接口 "dispatch = compose(...chain)(store.dispatch)"
    // 当前值只是用来保证中间件构件过程中即 "middleware(middlewareAPI)" dispatch不能被调用
    let composedDispatch = () => {
      throw new Error(
        `Dispatching while constructing your middleware is not allowed. ` +
          `Other middleware would not be applied to this dispatch.`
      )
    }

    // 注意！中间件处理完异步请求以后调用的dispatch是composedDispatch
    const middlewareAPI = {
      getState: store.getState,
      dispatch: (...args) => composedDispatch(...args)
    }

    // 按照文档，中间件的函数结构为store => next => action {...; next(action)}
    // 改一下参数名, 并给出一个默认的实现其实更好理解
    // 再次强调！异步请求以后调用的是chainedDispatch
    // let middleware = store => patchedDispatchOnRight => action => {
    //   let chainedDispatch = store.dispatch;
    //   asyncMethod(action.value, json => {
    //     let callbackAction = actionCreator(json);
    //     chainedDispatch(callbackAction);
    //   });
    //   patchedDispatchOnRight(action);
    // };

    // 基于中间件的store => next => action结构，下面的逻辑用职责链设计模式将所有中间件连接起来形成最终的dispatch接口
    const chain = middlewares.map(middleware => middleware(middlewareAPI))
    composedDispatch = compose(...chain)(store.dispatch)

    return {
      ...store,
      dispatch
    }
  }
}
