import { Component, Children } from 'react'
import PropTypes from 'prop-types'

// Provider组件的逻辑很简单，就是将redux的store（主要是getState以及dispatch接口）注入到context
export function createProvider(storeKey = 'store') {
    const subscriptionKey = `${storeKey}Subscription`

    class Provider extends Component {
        // 关键逻辑: 将this.store加到了context里，这样子组件就可以通过context直接拿到store，不需要一级一级props传递下去。
        getChildContext() {
          return { [storeKey]: this[storeKey], [subscriptionKey]: null }
        }

        constructor(props, context) {
          super(props, context)
          this[storeKey] = props.store
        }

        render() {
          // 只允许有一个直接子组件
          return Children.only(this.props.children)
        }
    }

    return Provider
}

export default createProvider()
