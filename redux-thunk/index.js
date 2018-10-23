// 如果action为函数，之前的中间件都不会进行处理，并且不会调用"next(action)"，所以之后的中间件以及原始的dispatch都不会处理action
// 随后我们调用action(dispatch, getState, extraArgument)

// 使用thunk中间件后，我们可以dispatch一个如下的函数，相应的异步逻辑可以直接写在这个函数中，代码结构很直观
// 不然异步逻辑处理必须写在某一个定义异步中间件的文件中
// onClick: () => dispatch(dispatch => {
//   dispatch({type: "SHOW_ERROR"});
//   setTimeout(() => dispatch({type: "HIDE_ERROR"}), 5000);
// })
function createThunkMiddleware(extraArgument) {
  return ({ dispatch, getState }) => next => action => {
    // 只处理action是函数的情况，否则调用next(action)给下一个dispatch处理。
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument);
    }

    return next(action);
  };
}

const thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

export default thunk;
