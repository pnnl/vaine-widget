import React, { useState } from 'react'
import { action } from '@storybook/addon-actions'

import { formatData } from '../src/helperFunctions/formatData'
import { formatStats } from '../src/helperFunctions/formatStats'

import { CollapseSelectors } from '../src/CollapseSelectors'
import { ContinuousSlider } from '../src/Slider'
import { DialogSelectors } from '../src/DialogSelectors'
import { SelectCondition } from '../src/SelectCondition'
import { Selectors } from '../src/Selectors'

export default {
  title: 'Components',
};

export const SliderTest = () => {
  const [pThreshold, setPThreshold] = React.useState(0.5)
  const [pThreshold1, setPThreshold1] = React.useState(15)
  const [pThreshold2, setPThreshold2] = React.useState(0)

  const onChangeP = (val) => {
    setPThreshold(val)
  }

  const onChangeP1 = (val) => {
    setPThreshold1(val)
  }

  const onChangeP2 = (val) => {
    setPThreshold2(val)
  }

  return (<div style={{'width':'300px'}}>
    <ContinuousSlider originalValue={pThreshold} title='Slider 1' onChange={onChangeP} />
    <ContinuousSlider originalValue={pThreshold1} title='Slider 2' min={-5} max={20} onChange={onChangeP1} />
    <ContinuousSlider originalValue={pThreshold2} title='Slider 3' min={-5} max={20} step={5} onChange={onChangeP2} />
  </div>)
}

export const SelectConditionTest = () => {
  const [test1, setTest1] = React.useState('1')
  const [test2, setTest2] = React.useState('platypus')

  return (
    <div style={{'display':'flex', 'flexDirection':'column'}}>
      <SelectCondition options={['1', '2', '3']}
                    currentSelected={test1}
                    title="Test"
                    onSelect={(val) => setTest1(val)} />
      <SelectCondition options={['platypus', 'cat', 'racoon', 'hamster', 'otter']}
                    currentSelected={test2}
                    title="Animals"
                    onSelect={(val) => setTest2(val)} />
    </div>)
}

export const SelectorsTest = () => {
  const [options1, setOptions1] = React.useState({'yes': false, 'no': true})
  const [options2, setOptions2] = React.useState({'1': true, '2': false, '3': true, '4': false, '5': true})
  const [options3, setOptions3] = React.useState({'sage': true, 'basil': true, 'cilantro': false,
                                                  'parsley': false, 'chives': true,
                                                  'chamomile': true, 'oregano': true, 'pepper': false})

  return (
    <div style={{'display':'flex'}}>
      <Selectors options={options1} sortedClusters={Object.keys(options1)} onSelect={(val) => setOptions1(val)} />
      <Selectors options={options2} sortedClusters={Object.keys(options2)} onSelect={(val) => setOptions2(val)} />
      <Selectors options={options3} sortedClusters={Object.keys(options3)} onSelect={(val) => setOptions3(val)} />
    </div>)
}

export const CollapseSelectorsTest = () => {
  const [options1, setOptions1] = React.useState({'yes': false, 'no': true})
  const [options2, setOptions2] = React.useState({'1': true, '2': false, '3': true, '4': false, '5': true})
  const [options3, setOptions3] = React.useState({'sage': true, 'basil': true, 'cilantro': false,
                                                  'parsley': false, 'chives': true,
                                                  'chamomile': true, 'oregano': true, 'pepper': false})

  return (
    <div style={{'display':'flex'}}>
      <CollapseSelectors options={options1} sortedClusters={Object.keys(options1)} onSelect={(val) => setOptions1(val)} />
      <CollapseSelectors options={options2} sortedClusters={Object.keys(options2)} onSelect={(val) => setOptions2(val)} />
      <CollapseSelectors options={options3} sortedClusters={Object.keys(options3)} onSelect={(val) => setOptions3(val)} />
    </div>)
}

export const DialogSelectorsTest = () => {
  const [options1, setOptions1] = React.useState({'yes': false, 'no': true})
  const [options2, setOptions2] = React.useState({'1': true, '2': false, '3': true, '4': false, '5': true})
  const [options3, setOptions3] = React.useState({'sage': true, 'basil': true, 'cilantro': false,
                                                  'parsley': false, 'chives': true,
                                                  'chamomile': true, 'oregano': true, 'pepper': false})

  return (
    <div style={{'display':'flex'}}>
      <DialogSelectors options={options1} sortedClusters={Object.keys(options1)} onSelect={(val) => setOptions1(val)} />
      <DialogSelectors options={options2} sortedClusters={Object.keys(options2)} onSelect={(val) => setOptions2(val)} />
      <DialogSelectors options={options3} sortedClusters={Object.keys(options3)} onSelect={(val) => setOptions3(val)} />
    </div>)
}
