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

import { formatData } from '../src/helperFunctions/formatData'

import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles((theme) => ({
	chart: {
    	display: "flex",
  	},
}))

// Visualization of a single covariate as a bee swarm plot
// Works with BeeSwarm.js
// Deprecated
export const SingleBeeSwarm = ({withinData=[], withoutData=[], covariate='', clusterAppearance, validClusters, deselected=[], identifier}) => {
	const classes = useStyles()
	const ref = useRef('singleswarm' + covariate)
	
	//For now, assume margin is equal all around the graph
	//Do not change these variables anywhere else
	const layout = {"width":610,
					"height":50,
					"marginLeft":200,
					"marginRight":10,
					"marginDefault":0}
	
	useEffect(() => {
		const svgElement = d3.select(ref.current)
		
		const g = svgElement.select("g")

		const chartHeight = layout.height-(layout.marginDefault * 2)
		const chartWidth = layout.width-(layout.marginRight + layout.marginLeft)

		const yScale = d3.scalePoint()
							 			 .domain([covariate])
						 				 .range([layout.marginDefault + chartHeight, layout.marginDefault])

		const xScale = d3.scaleLinear()
						 .domain([-6, 6])
						 .range([layout.marginLeft, layout.marginLeft + chartWidth])

		const allData = withinData.concat(withoutData)

		const mean = d3.mean(allData, d => d.value)
		const std = d3.deviation(allData, d => d.value)

		const zScale = (x) => { return (x - mean) / std}

		const fillColor = (d) => {
			const cluster = d.cluster
			if (!validClusters[cluster]) { return 'lightgray' }

			const index = d.index
			if (deselected.indexOf(index) > -1) { return 'lightgray' }

			return clusterAppearance[cluster] ? clusterAppearance[cluster].color : 'gray'
		}

		const isBrushed = (brush_coords, cx) => {

			const x0 = brush_coords[0][0]
			const	x1 = brush_coords[1][0]

			return x0 <= cx && cx <= x1
		}

		const highlightBrushedCircles = () => {
			if (d3.event.selection !== null) {
					points.attr("class", "subsetPoints non_brushed")
					allPoints.attr("class", "allPoints non_brushed")

					const brush_coords = d3.event.selection

					points.filter((p) => {
									 const cx = xScale(p.x)

									 return isBrushed(brush_coords, cx)
								 })
								 .attr("class", "subsetPoints brushed")

					allPoints.filter((p) => {
									 const cx = xScale(p.x)

									 return isBrushed(brush_coords, cx)
								 })
								 .attr("class", "allPoints brushed")
			}
		}

		const updateSelected = () => {
			if (!d3.event.selection) {
				points.attr("class", "subsetPoints")
				allPoints.attr("class", "allPoints")
			}

			d3.select(this).call(brush.move, null)

			// let newValidClusters = JSON.parse(JSON.stringify(validClusters))

			// for (let c of Object.keys(newValidClusters)) {
			// 	newValidClusters[c] = false
			// }

			const nonBrushed = svgElement.selectAll(".non_brushed").data()
			const nonBrushedIndices = nonBrushed.map(nb => nb.index)

			// onDeselect(nonBrushedIndices)
		}

		var brush = d3.brushX()
									.on("brush", highlightBrushedCircles)
									.on("end", updateSelected)

		g.call(brush)

		const allPoints = g.selectAll(".allPoints")
									 .data(withoutData)
									 .join("circle")
									 .attr("class", "allPoints")
									 .attr("cx", d => xScale(zScale(d.value)))
									 .attr("cy", d => yScale(d.covariate) - 5)
									 .attr("r", 2)
									 .style("fill", "gray")
									 .style("opacity", 0.5)
		
		const points = g.selectAll(".subsetPoints")
									 .data(withinData)
									 .join("circle")
									 .attr("class", "subsetPoints")
									 .attr("cx", d => xScale(zScale(d.value)))
									 .attr("cy", d => yScale(d.covariate) + 5)
									 .attr("r", 2)
									 .style("fill", d => fillColor(d))
									 .style("opacity", 0.5)

    d3.select("#yAxisBeeSwarm" + identifier)
      .call(d3.axisLeft(yScale).tickSizeOuter(3))
		
	}, [withinData, withoutData, covariate, clusterAppearance, validClusters, deselected])
	
	return <div className={classes.chart}>
		<svg width={layout.width} height={layout.height} ref={ref}>
				<g />
				<g transform={"translate(" + (layout.marginLeft - 25) + "," + layout.marginDefault + ")"} id={"yAxisBeeSwarm" + identifier} />
		</svg>
	</div>
}