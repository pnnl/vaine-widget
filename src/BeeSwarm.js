// VAINE Widget

// Copyright (c) 2020, Pacific Northwest National Laboratories
// All rights reserved.

// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:

// * Redistributions of source code must retain the above copyright notice, this
//   list of conditions and the following disclaimer.

// * Redistributions in binary form must reproduce the above copyright notice,
//   this list of conditions and the following disclaimer in the documentation
//   and/or other materials provided with the distribution.

// * Neither the name of the copyright holder nor the names of its
//   contributors may be used to endorse or promote products derived from
//   this software without specific prior written permission.

// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
// DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
// FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
// DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
// CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
// OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

import React, {useRef, useEffect} from 'react'
import * as d3 from 'd3'
import d3Tip from "d3-tip"
d3.tip = d3Tip

import { Selectors } from './Selectors'
import { SingleBeeSwarm } from './SingleBeeSwarm'

import { formatData } from '../src/helperFunctions/formatData'

import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles((theme) => ({
	chart: {
    display: "flex",
  },
  beeswarmContainer: {
  	display: "flex",
  	flexDirection: "column"
  }
}))

// This plot has been replaced by PCP
// However, the code is still included in case of future use
export const BeeSwarm = ({data, regressions, ignore=[], clusterAppearance, selectedTreatment, selectedOutcome, validClusters, deselected=[]}) => {
	const classes = useStyles()
	const ref = useRef('bees')

	const [dataset, setDataset] = React.useState([])

	const [dataSubset, setDataSubset] = React.useState([])
	const [allData, setAllData] = React.useState([])

	const [covariates, setCovariates] = React.useState({})
  const [selectedCovariates, setSelectedCovariates] = React.useState([])

  const [withinData, setWithinData] = React.useState({})
  const [withoutData, setWithoutData] = React.useState({})
  const [zScales, setZScales] = React.useState({})

  const layout = {"width":610,
					"height":50,
					"marginLeft":200,
					"marginRight":10,
					"marginDefault":0}

  useEffect(() => {
    let newDataset = []
    for (let r of Object.keys(regressions)) {
      newDataset = newDataset.concat(regressions[r].included)
    }

    setDataset(newDataset)
  }, [regressions])

  useEffect(() => {
    const originalVariables = data.columns
    let allCovariates = []

    for (let v of originalVariables) {
      if (v === selectedTreatment || v === selectedOutcome) {
        continue
      } else if (ignore.indexOf(v) > -1) {
        continue
      } else {
        allCovariates.push(v)
      }
    }

    let newCovariates = {}
    let newSelectedCovariates = []

    for (let i = 0; i < allCovariates.length; i++) {
      let c = allCovariates[i]
      if (i < 12) {
        newCovariates[c] = true
        newSelectedCovariates.push(c)
      } else {
        newCovariates[c] = false
      }
    }

    setCovariates(newCovariates)
    setSelectedCovariates(newSelectedCovariates)

  }, [data, selectedTreatment, selectedOutcome])

  const onSelectCovariate = (val) => {
    setCovariates(val)

    let newSelectedCovariates = []
    for (let c of Object.keys(val)) {
      if (val[c]) {
        newSelectedCovariates.push(c)
      }
    }

    setSelectedCovariates(newSelectedCovariates)
  }

  useEffect(() => {
  	const newWithin = dataset.filter(d => validClusters[d.cluster])
		const newWithout = dataset.filter(d => !validClusters[d.cluster])

		let newWithinData = {}
		let newWithoutData = {}
		let newZScales = {}

		for (let m of selectedCovariates) {
			newWithinData[m] = newWithin.map(d => {return {'covariate': m, 'value': d[m], 'cluster': d.cluster}})
			newWithoutData[m] = newWithout.map(d => {return {'covariate': m, 'value': d[m], 'cluster': d.cluster}})
		}

		setWithinData(newWithinData)
		setWithoutData(newWithoutData)
		setZScales(newZScales)

  }, [validClusters, selectedCovariates])

  useEffect(() => {
  	const chartWidth = layout.width-(layout.marginRight + layout.marginLeft)

		const xScale = d3.scaleLinear()
				 .domain([-6, 6])
				 .range([0, chartWidth])

		d3.select("#xAxisBeeSwarm")
      .call(d3.axisBottom(xScale).tickSize(3).ticks(5))
  }, [data])
	
	return <div className={classes.chart}>
		<div className={classes.selectorContainer}>
      <Selectors options={covariates} onSelect={onSelectCovariate} />
    </div>
    <div className={classes.beeswarmContainer}>
	    {selectedCovariates.map((s, i) => (
	    	<SingleBeeSwarm withinData={withinData[s]}
	    									withoutData={withoutData[s]}
	    									covariate={s}
	    									zScale={zScales[s]}
	    									clusterAppearance={clusterAppearance}
	    									validClusters={validClusters}
	    									key={i}
	    									identifier={i} />
	    ))}
	    <svg width={layout.width} height={layout.height} ref={ref}>
				<g transform={"translate(" + (layout.marginLeft) + "," + 0 + ")"} id="xAxisBeeSwarm" />
			</svg>
    </div>
	</div>
}