import React, {Component} from 'react'
import {render} from 'react-dom'

import props from './props.json'

import {VaineWidget} from '../../'

const Demo = () => {
  return <div>
    <h1>vane-widget Demo</h1>
    <div>
      Visual Analytics for Natural Experiments
    </div>
    <VaineWidget {...props}/>
    <div>
    Data Source: <a href='https://archive.ics.uci.edu/ml/machine-learning-databases/auto-mpg/'>Auto MPG</a>
    </div>
  </div>
}

render(<Demo/>, document.querySelector('#demo'))
