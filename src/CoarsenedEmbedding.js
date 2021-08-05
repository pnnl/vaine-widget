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

import { formatData } from '../src/helperFunctions/formatData'

import { makeStyles } from '@material-ui/core/styles'

let d3Tip = require("d3-tip").default;
d3Tip(d3);

const useStyles = makeStyles((theme) => ({
	chart: {
		border: "1px solid black"
	},
	lineDeselected: {
		"&:hover": {
			strokeWidth: 3
		}
	}
}))

// Visualize the embedding space of all points
export const CoarsenedEmbedding = ({selectedTreatment, regressions, validClusters, deselected=[], clusterName={}, clusterAppearance={}, onSelect, onDeselect}) => {
	const classes = useStyles()
	const ref = useRef('dataset')

	const [regressionLines, setRegressionLines] = React.useState([])
	
	const [dataset, setDataset] = React.useState([])

	//For now, assume margin is equal all around the graph
	//Do not change these variables anywhere else
	const layout = {"width":250,
									"height":250,
									"margin":25}

	// Get all included points
	useEffect(() => {
		let newDataset = []
		for (let r of Object.keys(regressions)) {
			newDataset = newDataset.concat(regressions[r].included)
		}

		setDataset(newDataset)
	}, [regressions])

	// For each cluster, calculate start and end points of treatment/outcome regression line
	// Regression line is overlaid on cluster centroid, does not directly correspond to
	// Embedding coordinates
	useEffect(() => {
		const validClusters = Object.keys(regressions)

		let newRegressionLines = []

		for (let c of validClusters) {
			const clusterRegression = regressions[c]

			const rvalue = clusterRegression.rvalue
			const theta = Math.PI/4*rvalue
			const dx = Math.cos(theta)
			const dy = Math.sin(theta)

			const clusterPoints = clusterRegression.included
			const clusterCentroidX = d3.mean(clusterPoints, d => d.x)
			const clusterCentroidY = d3.mean(clusterPoints, d => d.y)

			newRegressionLines.push({'cluster':c,
															 'x1':clusterCentroidX - dx, 
															 'y1':clusterCentroidY - dy,
															 'x2':clusterCentroidX + dx,
															 'y2':clusterCentroidY + dy})
		}

		setRegressionLines(newRegressionLines)

	}, [regressions])

	// Update selected clusters on user input
	const handleChange = (cluster) => {
		d3.selectAll(".d3-tip").remove()
		let newValidClusters = JSON.parse(JSON.stringify(validClusters))
		const current = newValidClusters[cluster]

		if (!current) {
			newValidClusters[cluster] = true
		} else {
			newValidClusters[cluster] = false
		}

		onSelect(newValidClusters)
	}
	
	useEffect(() => {
		const svgElement = d3.select(ref.current)

		d3.selectAll(".d3-tip-embedding").remove()
		
		const g = svgElement.select("g")
		const gEmbeddingLines = svgElement.select("#embeddingLines")

		if (d3.event && d3.event.selection) {
			g.call(brush.move, null)
		}

		const chartHeight = layout.height-(layout.margin * 2)
		const chartWidth = layout.width-(layout.margin * 2)
		
		const xScale = d3.scaleLinear()
						 .domain(d3.extent(dataset, d => d.x))
						 .range([layout.margin, layout.margin + chartWidth])
				
		const yScale = d3.scaleLinear()
						 .domain(d3.extent(dataset, d => d.y))
						 .range([layout.margin + chartHeight, layout.margin])

		const isBrushed = (brush_coords, cx, cy) => {

			var x0 = brush_coords[0][0],
					x1 = brush_coords[1][0],
					y0 = brush_coords[0][1],
					y1 = brush_coords[1][1];

			return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;
		}

		const highlightBrushedCircles = () => {
			if (d3.event.selection !== null) {
					points.attr("class", "non_brushed")

					const brush_coords = d3.event.selection

					points.filter((p) => {
									 const cx = xScale(p.x)
									 const cy = yScale(p.y)

									 return isBrushed(brush_coords, cx, cy)
								 })
								 .attr("class", "brushed")
			}
		}

		// Determine which points are selected
		// Update deselected points
		// If `command` (meta) key is held down, perform union select
		const updateSelected = () => {
			if (!d3.event.selection) {
				points.attr("class", null)
				onDeselect([], 'embedding', true)
				return
			}

			d3.select(this).call(brush.move, null)

			const nonBrushed = svgElement.selectAll(".non_brushed").data()
			const nonBrushedIndices = nonBrushed.map(nb => nb.index)

			onDeselect(nonBrushedIndices, 'embedding', d3.event.sourceEvent.metaKey)
		}

		var brush = d3.brush()
									.on("brush", highlightBrushedCircles)
									.on("end", updateSelected)

		g.call(brush)

		console.log('d3Tip', d3Tip)
		// let tip = {};

		let tip = d3Tip()
			.attr('class', 'd3-tip-embedding')
			.offset([-10, 0])
			.html(function(d) {
				if (d.index) {
					return `<b>${clusterName[d.cluster].name}</b><br />
									${d.index}`
				}
				return `<b>Cluster ${clusterName[d.cluster].name}</b><br />
								<i>Click to toggle select</i>`
			})

		svgElement.call(tip)

		const fillColor = (d) => {
			const cluster = d.cluster
			if (!validClusters[cluster]) { return 'lightgray' }

			const index = d.index
			if (deselected.indexOf(index) > -1) { return 'lightgray' }

			return clusterAppearance[cluster] ? clusterAppearance[cluster].color : 'gray'
		}

		const size = (d) => {
			const cluster = d.cluster
			if (!validClusters[cluster]) { return 1 }
			
			const index = d.index
			if (deselected.indexOf(index) > -1) { return 1 }

			return 2
		}

		const strokeColor = (d) => {
			const cluster = d.cluster
			if (!validClusters[cluster]) { return 'gray' }

			const index = d.index
			if (deselected.indexOf(index) > -1) { return 'gray' }

			return 'black'
		}

		const strokeClass = (d) => {
			const cluster = d.cluster
			if (!validClusters[cluster]) { return 'lineDeselected' }
			
			const index = d.index
			if (deselected.indexOf(index) > -1) { return 'lineDeselected' }

			return 'lineSelected'
		}

		const points = g.selectAll("circle")
									 .data(dataset)
									 .join("circle")
									 .attr("cx", d => xScale(d.x))
									 .attr("cy", d => yScale(d.y))
									 .attr("r", d => size(d))
									 .style("fill", d => fillColor(d))
									 .on('mouseover', tip.show)
									 .on('mouseout', tip.hide)

		const lines = gEmbeddingLines.selectAll("line")
									 .data(regressionLines)
									 .join("line")
									 .attr("class", d => strokeClass(d))
									 .attr("x1", d => xScale(d.x1))
									 .attr("y1", d => yScale(d.y1))
									 .attr("x2", d => xScale(d.x2))
									 .attr("y2", d => yScale(d.y2))
									 .style("stroke", d => strokeColor(d))
									 .style("cursor", "pointer")
									 .on("click", function(d) {
										handleChange(d.cluster)
									 })
									 .on('mouseover', tip.show)
									 .on('mouseout', tip.hide)

		svgElement.selectAll("text")
			.data([selectedTreatment])
			.join("text")
			.attr("text-anchor", "middle")
			.attr("x", layout.width / 2)
			.attr("y", layout.height - 5)
			.style("font-size", "9px")
			.style("font-family", "sans-serif")
			.text(d => d)
		
	}, [dataset, clusterName, selectedTreatment, regressionLines, validClusters, regressions, deselected, clusterAppearance])
	
	return <div className={classes.chart}>
		<svg width={layout.width} height={layout.height} ref={ref}>
				<g/>
				<g id="embeddingLines"/>
		</svg>
	</div>
}