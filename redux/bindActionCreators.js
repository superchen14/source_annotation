// actionCreator只负责根据参数返回一个action
// 用bindActionCreator修饰后的actionCreator，不仅会返回一个action并且会dispatch这个action
function bindActionCreator(actionCreator, dispatch) {
  return function() {
    return dispatch(actionCreator.apply(this, arguments))
  }
}

// 对一个定义了多个action的集合绑定dispatch操作
export default function bindActionCreators(actionCreators, dispatch) {
  // 如果actionCreators是函数，那么bindActionCreators等同于bindActionCreator
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch)
  }

  // 异常处理
  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error("actionCreators类型错误")
  }

  // 遍历每个actionCreator并用bindActionCreator进行修饰
  const keys = Object.keys(actionCreators)
  const boundActionCreators = {}
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const actionCreator = actionCreators[key]
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  return boundActionCreators
}
