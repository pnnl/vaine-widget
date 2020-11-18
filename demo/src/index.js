import React, {Component} from 'react'
import {render} from 'react-dom'

import {Example} from '../../src'

class Demo extends Component {
  render() {
    return <div>
      <h1>vane-widget Demo</h1>
      <div>
        Visual Analytics for Natural Experiments
      </div>
      <Example hello='world'/>
    </div>
  }
}

render(<Demo/>, document.querySelector('#demo'))
