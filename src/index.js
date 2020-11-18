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

import React, {useRef, useEffect, useState} from 'react'

import Paper from '@material-ui/core/Paper'

import * as d3 from 'd3'
import crossfilter from 'crossfilter2'

import './Index.css'

import { BeeSwarm } from './BeeSwarm'
import { ClusterDialog } from './ClusterDialog'
import { CoarsenedEmbedding } from './CoarsenedEmbedding'
import { CoarsenedLmplot } from './CoarsenedLmplot'
import { CollapseSelectors } from './CollapseSelectors'
import { ContinuousSlider } from './Slider'
import { NumberInput } from './NumberInput'
import { PCP } from './PCP'
import { SelectCondition } from './SelectCondition'
import { Selectors } from './Selectors'
import { MenuTabs } from './Tabs'

import { clusterStats } from '../src/helperFunctions/clusterStats'
import { getATE } from '../src/helperFunctions/getATE'
import { processData } from '../src/helperFunctions/processData'
import { realizeClusters } from '../src/helperFunctions/realizeClusters'

import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles((theme) => ({
	main: {
		display: 'flex',
	},
	selections: {
		width: 150,
		marginRight: 15
	},
	body: {
		display: 'flex',
		flexDirection: 'column'
	},
	embeddingLM: {
		display: 'flex'
	},
	paperEmbedding: {
		padding: '25px',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'flex-end',
		marginRight: 15
	},
	embedding: {
		display: "flex",
		alignItems: "flex-start",
		justifyContent: "space-between",
		width: "100%"
	},
	paperLM: {
		padding: '25px',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'flex-end',
	},
	paperHeader: {
		display: 'flex',
		width: '100%',
		marginBottom: '25px'
	},
	paperTitle: {
		fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif;',
		fontSize: 15,
		margin: 0,
		color: '#505050'
	},
	paperPCP: {
		padding: '25px',
		display: 'flex',
		flexDirection: 'column',
		marginTop: 15
	}
}))

export const VaineWidget = ({data, covariates, treatments, outcomes, ignore, latentRepresentation}) => {
	const classes = useStyles()

	// Dataset used for current treatment outcome pair + clustering
	const [dataset, setDataset] = React.useState([])

	// Track analysis settings
	const [pThreshold, setPThreshold] = React.useState(0.05)
	const [nClusters, setNClusters] = React.useState(10)
	const [validClusters, setValidClusters] = React.useState({})

	// Track selected treatment outcome pair
	const [selectedTreatment, setSelectedTreatment] = React.useState(treatments[0])
	const [selectedOutcome, setSelectedOutcome] = React.useState(outcomes[0])

	// Store stats about each cluster
	const [regressions, setRegressions] = React.useState({})
	const [sortedClusters, setSortedClusters] = React.useState([])
	const [ATE, setATE] = React.useState(0)

	// Track custom cluster names and colors
	const [clusterAppearance, setClusterAppearance] = React.useState({})
	const [clusterName, setClusterName] = React.useState({})

	// Track whether the cluster details view is open
	const [clusterDialogOpen, setClusterDialogOpen] = React.useState(false)
	const [selectedCluster, setSelectedCluster] = React.useState('')

	// Track points that are not brushed in a plot
	// This does not exclude the points,
	// simply highlights them for visual analysis
	const [deselected, setDeselected] = React.useState([])
	const [deselectedByPlot, setDeselectedByPlot] = React.useState({})

	// Track points that are excluded per treatment/outcome combination
	// This changes the calculated linear regression of each cluster
	const [excluded, setExcluded] = React.useState({})

	// Update dataset when the input data changes
	// Or when selected treatment/num clusters changes
	// Dataset contains cluster information, data does not
	useEffect(() => {
		const clusters = realizeClusters({'n': nClusters, 'parents':latentRepresentation[selectedTreatment].parents})
		const clustersByPoint = clusters.byPoint
		const embeddings = latentRepresentation[selectedTreatment].points
		const newDataset = processData(data, ignore, clustersByPoint, embeddings)

		setDataset(newDataset)
	}, [data, selectedTreatment, nClusters])

	// Calculate cluster statistics on dataset change
	useEffect (() => {
		const allClusters = d3.map(dataset, function(d){return d.cluster}).keys()

		const currentExcluded = excluded[selectedTreatment+'|'+selectedOutcome] ? excluded[selectedTreatment+'|'+selectedOutcome] : []

		const newRegressions = clusterStats(dataset, currentExcluded, allClusters, selectedTreatment, selectedOutcome)
		const ATE = getATE(newRegressions)

		let newSelections = {}
		for (let s of allClusters) {
			if (isNaN(newRegressions[s].rvalue)) {
				newSelections[s] = false
			} else if (newRegressions[s].pvalue < pThreshold) {
				newSelections[s] = true
			} else {
				newSelections[s] = false
			}
		}

		const newSorted = Object.keys(newRegressions).sort()

		setValidClusters(newSelections)
		setRegressions(newRegressions)
		setSortedClusters(newSorted)
		setATE(ATE)

	}, [dataset, selectedTreatment, selectedOutcome])

	// Calculate cluster statistics when points are excluded
	useEffect (() => {
		const allClusters = d3.map(dataset, function(d){return d.cluster}).keys()

		const currentExcluded = excluded[selectedTreatment+'|'+selectedOutcome] ? excluded[selectedTreatment+'|'+selectedOutcome] : []

		const newRegressions = clusterStats(dataset, currentExcluded, allClusters, selectedTreatment, selectedOutcome)
		const ATE = getATE(newRegressions)

		const newSorted = Object.keys(newRegressions).sort()

		setRegressions(newRegressions)
		setSortedClusters(newSorted)
		setATE(ATE)

	}, [excluded])

	// Update valid clusters (p < pThreshold) on pThreshold change
	useEffect(() => {
		let newSelections = {}
		for (let s of Object.keys(validClusters)) {
			if (isNaN(regressions[s].rvalue)) {
				newSelections[s] = false
			} else if (regressions[s].pvalue < pThreshold) {
				newSelections[s] = true
			} else {
				newSelections[s] = false
			}
		}

		setValidClusters(newSelections)
	}, [pThreshold])

	// Assign cluster colors by cluster sort
	useEffect(() => {
		const colorScale = d3.scaleOrdinal(d3.schemeTableau10)
                       		 .domain(sortedClusters)
		let newClusterAppearance = JSON.parse(JSON.stringify(clusterAppearance))
		let newClusterName = JSON.parse(JSON.stringify(clusterName))

		for (let c of sortedClusters) {
			let currentCluster = newClusterAppearance[c]
			let scaleColor = colorScale(c)

			if (!currentCluster) {
				newClusterAppearance[c] = { 'color': scaleColor, 'status': 'default'}
				newClusterName[c] = { 'name': c, 'status': 'default'}
			} else {
				// Only update color if the cluster uses default colors
				// User-specified custom colors will be maintained
				if (currentCluster.status === 'default') {
					newClusterAppearance[c] = { 'color': scaleColor, 'status': 'default'}
				}
			}
		}

		setClusterAppearance(newClusterAppearance)
		setClusterName(newClusterName)
	}, [sortedClusters])

	// Update overall deselected points when selection changes
	// In individual plots
	useEffect(() => {
		let newDeselected

		for (let p of Object.keys(deselectedByPlot)) {
			let currentDeselected = deselectedByPlot[p]
			if (!newDeselected) {
				newDeselected = currentDeselected
			} else if (currentDeselected.length === 0) {
				continue
			} else {
				newDeselected = newDeselected.filter(d => currentDeselected.indexOf(d) > -1)
			}
		}
		setDeselected(newDeselected)
	}, [deselectedByPlot])

	// Update pThreshold
	const onChangeP = (val) => {
		setPThreshold(val)
	}

	// Update number of clusters
	const onChangeNClusters = (val) => {
		setNClusters(val)
	}

	// Update valid clusters
	// Allows users to manually select/deselect
	const onSelectCluster = (val) => {
		setValidClusters(val)
	}

	// Update selected treatment
	const onSelectTreatment = (val) => {
		setSelectedTreatment(val)
	}

	// Update selected outcome
	const onSelectOutcome = (val) => {
		setSelectedOutcome(val)
	}

	// Closes cluster details dialog
	const onDialogClose = () => {
		setClusterDialogOpen(false)
	}

	// Opens cluster details dialog
	const viewDetails = (cluster) => {
		setClusterDialogOpen(true)
		setSelectedCluster(cluster)
	}

	// Update selected points per plot
	// Assume replace select unless union === true
	const onDeselect = (val, plot, union=false) => {
		if (!union) {
			const newDeselectByPlot = {}
			newDeselectByPlot[plot] = val
			setDeselectedByPlot(newDeselectByPlot)
		} else {
			let newDeselectByPlot = JSON.parse(JSON.stringify(deselectedByPlot))
			newDeselectByPlot[plot] = val
			setDeselectedByPlot(newDeselectByPlot)
		}
	}

	// Update excluded points by treatment/outcome combination
	const onExclude = () => {
		if (deselected.length === 0) { return }

		let newDataset = []

	    for (let r of Object.keys(regressions)) {
	      newDataset = newDataset.concat(regressions[r].included)
	    }

		const newExcluded = newDataset.filter(d => deselected.indexOf(d.index) === -1)

		let newExcludedDict = JSON.parse(JSON.stringify(excluded))
		const currentExcluded = newExcludedDict[selectedTreatment+'|'+selectedOutcome] ? newExcludedDict[selectedTreatment+'|'+selectedOutcome] : []
		newExcludedDict[selectedTreatment+'|'+selectedOutcome] = currentExcluded.concat(newExcluded)
		setExcluded(newExcludedDict)
	}

	// Inserts previously excluded point back into analysis
	const onInclude = (val, to) => {
		let newExcludedDict = JSON.parse(JSON.stringify(excluded))
		const currentExcluded = newExcludedDict[to]

		const newExcluded = currentExcluded.filter(d => d.index !== val.index)
		if (newExcluded.length === 0) {
			delete newExcludedDict[to]
		} else {
			newExcludedDict[to] = newExcluded
		}

		setExcluded(newExcludedDict)
	}

	// Allows users to customize cluster color
	const updateClusterAppearance = (cluster, color) => {
		let newClusterAppearance = JSON.parse(JSON.stringify(clusterAppearance))
		let currentCluster = newClusterAppearance[cluster]

		if (!currentCluster) {
			newClusterAppearance[cluster] = {}
		}

		if (color) {
			currentCluster.color = color
			currentCluster.status = 'custom'
		}

		setClusterAppearance(newClusterAppearance)
	}

	// Allows users to customize cluster name
	const updateClusterName = (cluster, name) => {
		let newClusterName = JSON.parse(JSON.stringify(clusterName))
		let currentCluster = newClusterName[cluster]

		if (!currentCluster) {
			newClusterAppearance[cluster] = {}
		}

		if (name) {
			currentCluster.name = name
			currentCluster.status = 'custom'
		}

		setClusterName(newClusterName)
	}

	const getNoClusterATE = () => {
		const singleCluster = realizeClusters({'n': 1, 'parents':latentRepresentation[selectedTreatment].parents})
		const clustersByPoint = singleCluster.byPoint
		const embeddings = latentRepresentation[selectedTreatment].points
		const newDataset = processData(data, ignore, clustersByPoint, embeddings)
		const singleClusterKey = d3.map(newDataset, function(d){return d.cluster}).keys()
		const currentExcluded = excluded[selectedTreatment+'|'+selectedOutcome] ? excluded[selectedTreatment+'|'+selectedOutcome] : []
		const newRegressions = clusterStats(newDataset, currentExcluded, singleClusterKey, selectedTreatment, selectedOutcome)

		return getATE(newRegressions)
	}

	// Convert details of analysis to json
	const save = () => {
  	let newData = {}
  	newData.treatment = selectedTreatment
  	newData.outcome = selectedOutcome

  	let allClusters = []

  	for (let c of Object.keys(regressions)) {
  		let newCluster = {}
  		newCluster.name = c
  		newCluster.customName = clusterName[c].name
  		newCluster.status = validClusters[c] ? 'selected' : 'deselected'
  		newCluster.included = regressions[c].included
  		newCluster.excluded = regressions[c].excluded
  		newCluster.rvalue = regressions[c].rvalue
  		newCluster.pvalue = regressions[c].pvalue
  		newCluster.slope = regressions[c].equation[0]
  		newCluster.intercept = regressions[c].equation[1]
  		allClusters.push(newCluster)
  	}
  	newData.clusters = allClusters

  	let validRegressions = {}
    for (let r of Object.keys(regressions)) {
      if (validClusters[r]) {
        validRegressions[r] = JSON.parse(JSON.stringify(regressions[r]))
      }
    }

    // ATE values always exclude points that user designated as excluded
    const selectedATE = getATE(validRegressions)
    newData['ATE(selected clusters)'] = selectedATE

    newData['ATE(no clusters)'] = getNoClusterATE()
    newData['ATE(all clusters)'] = ATE

  	const filename = selectedTreatment + selectedOutcome + '.json'

    download(filename, JSON.stringify(newData))
  }

  // Download analysis stats
  const download = (filename, text) => {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text))
    element.setAttribute('download', filename)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
  }
	
	return <div className={classes.main}>
			<div className={classes.selections}>
				<SelectCondition options={outcomes}
											currentSelected={selectedOutcome}
											title="Outcomes"
											onSelect={onSelectOutcome} />
				<SelectCondition options={treatments}
											currentSelected={selectedTreatment}
											title="Treatments"
											onSelect={onSelectTreatment} />
				{/*<p>Additional Settings</p>*/}
			</div>
			<div className={classes.body}>
				<MenuTabs
					pThreshold={pThreshold}
					onChangeP={onChangeP}
					excluded={excluded}
					onExclude={onExclude}
					onInclude={onInclude}
					onSave={save} />
				<div className={classes.embeddingLM}>
					<Paper className={classes.paperEmbedding}>
						<div className={classes.paperHeader}>
							<CollapseSelectors key={"Clusters" + nClusters}
									   options={validClusters}
									   regressions={regressions}
									   clusterName={clusterName}	
									   clusterAppearance={clusterAppearance}
									   showDetails={true}
									   onSelect={onSelectCluster}
									   onViewDetails={viewDetails}
									   title="Clusters" />
							<NumberInput currentValue={nClusters} onChange={onChangeNClusters} />
						</div>
						<div className={classes.embedding}>
							<CoarsenedEmbedding selectedTreatment={selectedTreatment}
												regressions={regressions}
												validClusters={validClusters}
												deselected={deselected}
												clusterName={clusterName}
												clusterAppearance={clusterAppearance}
												onSelect={onSelectCluster}
												onDeselect={onDeselect} />
						</div>
					</Paper>
					<Paper className={classes.paperLM}>
						<CoarsenedLmplot selectedTreatment={selectedTreatment}
										 selectedOutcome={selectedOutcome}
										 overallATE={ATE}
										 regressions={regressions}
										 validClusters={validClusters}
										 deselected={deselected}
										 clusterName={clusterName}
										 clusterAppearance={clusterAppearance}
										 onSelect={onSelectCluster}
										 onDeselect={onDeselect} />
					</Paper>
				</div>
				<Paper className={classes.paperPCP}>
					{/*<BeeSwarm data={data}
							  regressions={regressions}
								ignore={ignore}
								clusterAppearance={clusterAppearance}
								sortedClusters={sortedClusters}
								selectedTreatment={onSelectTreatment}
								selectedOutcome={selectedOutcome}
								validClusters={validClusters} />*/}
						<PCP data={data}
							  regressions={regressions}
								ignore={ignore}
								clusterAppearance={clusterAppearance}
								sortedClusters={sortedClusters}
								selectedTreatment={selectedTreatment}
								selectedOutcome={selectedOutcome}
								validClusters={validClusters}
								deselected={deselected}
								onDeselect={onDeselect} />		
				</Paper>
			</div>
			<ClusterDialog
				data={data}
				dataset={regressions[selectedCluster] ? regressions[selectedCluster].included : []}
				ignore={ignore}
				clusterName={clusterName}
				clusterAppearance={clusterAppearance}
				selectedTreatment={onSelectTreatment}
				selectedOutcome={selectedOutcome}
				selectedCluster={selectedCluster}
				validClusters={validClusters}
				isOpen={clusterDialogOpen}
				onClose={onDialogClose}
				updateClusterAppearance={updateClusterAppearance}
				updateClusterName={updateClusterName}
				onSelect={onSelectCluster} />
	</div>
}
