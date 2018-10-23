// 默认的相等判断函数
function defaultEqualityCheck(a, b) { return a === b }

// 用equalityCheck来遍历判断prev和next是否相等
function areArgumentsShallowlyEqual(equalityCheck, prev, next) {
  if (prev === null || next === null || prev.length !== next.length) { return false }

  const length = prev.length
  for (let i = 0; i < length; i++) {
    if (!equalityCheck(prev[i], next[i])) { return false }
  }
  return true
}

// defaultMemoize返回一个函数，该函数每次被调用都会将当前的arguments保存为lastArgs并将func计算得到的结果保存为lastResult
// 下一次调用时基于equalityCheck将lastArgs与arguments进行比较
// 如果equalityCheck认为lastArgs与arguments相同，则直接返回lastResult
export function defaultMemoize(func, equalityCheck = defaultEqualityCheck) {
  let lastArgs = null
  let lastResult = null
  return function () {
    if (!areArgumentsShallowlyEqual(equalityCheck, lastArgs, arguments)) {
      lastResult = func.apply(null, arguments)
    }

    lastArgs = arguments
    return lastResult
  }
}

// selector有两种写法
// const shopItemsSelector = state => state.shop.items
// const taxPercentSelector = state => state.shop.taxPercent
// const getTaxTotal = (items, taxPercent) => items.reduce((acc, item) => acc + item.value * taxPercent / 100, 0)
// 1. const taxPercentSelector = createSelector(shopItemsSelector, taxPercentSelector, getTaxTotal)
// 2. const taxPercentSelector = createSelector([shopItemsSelector, taxPercentSelector], getTaxTotal)
// getDependencies就是用来处理两种写法获得dependencies数组
function getDependencies(funcs) {
  return Array.isArray(funcs[0]) ? funcs[0] : funcs
}

export function createSelectorCreator(memoize, ...memoizeOptions) {
  return (...funcs) => {
    let recomputations = 0
    const resultFunc = funcs.pop()
    const dependencies = getDependencies(funcs)

    // 用memoize封装保证dependencies的计算结果不变就可以直接返回上一次的结果
    const memoizedResultFunc = memoize(
      function () {
        recomputations++
        return resultFunc.apply(null, arguments)
      },
      ...memoizeOptions
    )

    // 用memoize封装保证dependencies的参数不变就不需要计算每个dependency直接返回上一次的结果
    const selector = memoize(function () {
      const params = []
      const length = dependencies.length

      for (let i = 0; i < length; i++) {
        params.push(dependencies[i].apply(null, arguments))
      }

      return memoizedResultFunc.apply(null, params)
    })

    selector.resultFunc = resultFunc
    selector.dependencies = dependencies
    selector.recomputations = () => recomputations
    selector.resetRecomputations = () => recomputations = 0
    return selector
  }
}

// 导出一个内置defaultMemoize的createSelector
export const createSelector = createSelectorCreator(defaultMemoize)

export function createStructuredSelector(selectors, selectorCreator = createSelector) {
  const objectKeys = Object.keys(selectors)
  return selectorCreator(
    objectKeys.map(key => selectors[key]),
    (...values) => {
      return values.reduce((composition, value, index) => {
        composition[objectKeys[index]] = value
        return composition
      }, {})
    }
  )
}
