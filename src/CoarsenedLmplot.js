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

import { getATE } from '../src/helperFunctions/getATE'

import IconButton from '@material-ui/core/IconButton'

import VisibilityOff from '@material-ui/icons/VisibilityOff'
import Autorenew from '@material-ui/icons/Autorenew'

import { makeStyles } from '@material-ui/core/styles'

let d3Tip = require("d3-tip").default;
d3Tip(d3);

const useStyles = makeStyles((theme) => ({
  lmLayout: {
    display: "flex",
    flexDirection: "column",
    alignItems: 'flex-start'
  },
  title: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif;',
    fontSize: 15,
    color: '#505050',
    marginTop: 0,
    marginBottom: 10
  },
  subtitle: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif;',
    fontSize: 8,
    color: '#505050',
    marginTop: 0,
    marginBottom: 7
  },
  lmContent: {
    display: "flex"
  },
  menu: {
    display: "flex",
    flexDirection: "column"
  },
  button: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginDefaultBottom: 15,
    cursor: "pointer",
    '& .MuiSvgIcon-root': {
      fontSize: "1rem"
    },
    '& .MuiButtonBase-root': {
      padding: 3
    }
  },
  buttonText: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif;',
    fontSize: 8,
    marginDefault: 0,
  }
}))

// Visualizes treatment/outcome plot of clusters
export const CoarsenedLmplot = ({selectedTreatment, selectedOutcome, overallATE, regressions, validClusters, deselected=[], clusterName={}, clusterAppearance={}, onSelect, onDeselect}) => {
  const classes = useStyles()
  const ref = useRef('lmplot')

  const [regressionLines, setRegressionLines] = React.useState([])
  const [ATE, setATE] = React.useState(0)
  const [dataset, setDataset] = React.useState([])

  const layout = {"width":300,
                  "height":250,
                  "marginDefault":25,
                  "marginLeft": 50}

  // Get all included points
  useEffect(() => {
    let newDataset = []
    for (let r of Object.keys(regressions)) {
      newDataset = newDataset.concat(regressions[r].included)
    }

    setDataset(newDataset)
  }, [regressions])

  // For each cluster, calculate start and end points of treatment/outcome regression line
  useEffect(() => {
    const validClusters = Object.keys(regressions)

    let newRegressionLines = []

    for (let c of validClusters) {
      const clusterRegression = regressions[c]

      const clusterPoints = clusterRegression.included

      const regressionStart = clusterRegression.predict(d3.min(clusterPoints, d => d[selectedTreatment]))
      const regressionEnd = clusterRegression.predict(d3.max(clusterPoints, d => d[selectedTreatment]))

      newRegressionLines.push({'cluster':c,
                               'x1':regressionStart[0], 
                               'y1':regressionStart[1],
                               'x2':regressionEnd[0],
                               'y2':regressionEnd[1]})
    }

    setRegressionLines(newRegressionLines)

  }, [regressions])

  // Calculate average treatment effect of selected clusters
  useEffect(() => {
    let validRegressions = {}
    for (let r of Object.keys(regressions)) {
      if (validClusters[r]) {
        validRegressions[r] = JSON.parse(JSON.stringify(regressions[r]))
      }
    }

    setATE(getATE(validRegressions))

  }, [regressions, validClusters])

  // Update selected clusters on user input
  const handleChange = (cluster) => {
    d3.selectAll(".d3-tip-lmplot").remove()
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

    d3.selectAll(".d3-tip-lmplot").remove()
    
    const g = svgElement.select("g")

    const chartHeight = layout.height-(layout.marginDefault * 2)
    const chartWidth = layout.width-(layout.marginDefault + layout.marginLeft)
    
    const xScale = d3.scaleLinear()
                     .domain([0, d3.max(dataset, d => d[selectedTreatment])])
                     .range([layout.marginLeft, layout.marginLeft + chartWidth])

    const yScale = d3.scaleLinear()
                     .domain(d3.extent(dataset, d => d[selectedOutcome]))
                     .range([layout.marginDefault + chartHeight, layout.marginDefault])

    const fillColor = (d) => {
      const cluster = d.cluster
      if (!validClusters[cluster]) { return 'lightgray' }

      const index = d.index
      if (deselected.indexOf(index) > -1) { return 'lightgray' }

      return clusterAppearance[cluster] ? clusterAppearance[cluster].color : 'gray'
    }

    const fillOpacity = (d) => {
      const cluster = d.cluster
      if (!validClusters[cluster]) { return 0.5 }

      const index = d.index
      if (deselected.indexOf(index) > -1) { return 0.5 }

      return 1
    }

    const size = (d) => {
      const cluster = d.cluster
      if (!validClusters[cluster]) { return 1 }
      
      const index = d.index
      if (deselected.indexOf(index) > -1) { return 1 }

      return 2
    }

    const stroke = (d) => {
      const cluster = d.cluster
      if (!validClusters[cluster]) { return 0 }
      return 1
    }

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

          var brush_coords = d3.event.selection

          points.filter((p) => {
                   const cx = xScale(p[selectedTreatment])
                   const cy = yScale(p[selectedOutcome])

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
        onDeselect([], 'lmplot', true)
        return
      }

      d3.select(this).call(brush.move, null)

      let newValidClusters = JSON.parse(JSON.stringify(validClusters))

      for (let c of Object.keys(newValidClusters)) {
        newValidClusters[c] = false
      }

      const nonBrushed = svgElement.selectAll(".non_brushed").data()
      const nonBrushedIndices = nonBrushed.map(nb => nb.index)

      onDeselect(nonBrushedIndices, 'lmplot', d3.event.sourceEvent.metaKey)
    }

    var brush = d3.brush()
                  .on("brush", highlightBrushedCircles)
                  .on("end", updateSelected)

    g.call(brush)

    console.log('d3Tip', d3Tip)
    // let tip = {};    

    let tip = d3Tip()
      .attr('class', 'd3-tip-lmplot')
      .offset([-10, 0])
      .html(function(d) {
        if (d.index) {
          return `<b>${clusterName[d.cluster].name}</b><br />
                  ${d.index}`
        }
        return `<b>Cluster ${clusterName[d.cluster].name}</b>`
      })

    g.call(tip)

    d3.select("#xAxis")
      .call(d3.axisBottom(xScale).tickSize(3).ticks(5))

    d3.select("#yAxis")
      .call(d3.axisLeft(yScale).tickSize(3).ticks(5))
    
    const points = g.selectAll("circle")
                   .data(dataset)
                   .join("circle")
                   .attr("cx", d => xScale(d[selectedTreatment]))
                   .attr("cy", d => yScale(d[selectedOutcome]))
                   .attr("r", d => size(d))
                   .attr("opacity", d => fillOpacity(d))
                   .style("fill", d => fillColor(d))
                   .on('mouseover', tip.show)
                   .on('mouseout', tip.hide)

    const lines = g.selectAll("line")
                   .data(regressionLines)
                   .join("line")
                   .attr("id", d => `line ${d.cluster}`)
                   .attr("x1", d => xScale(d.x1))
                   .attr("y1", d => yScale(d.y1))
                   .attr("x2", d => xScale(d.x2))
                   .attr("y2", d => yScale(d.y2))
                   .style("stroke", d => fillColor(d))
                   .style("stroke-width", d => stroke(d))
                   .style("cursor", "pointer")
                   .on("click", function(d) {
                    handleChange(d.cluster)
                   })
                   .on('mouseover', tip.show)
                   .on('mouseout', tip.hide)

    const xAxis = svgElement.selectAll(".xAxis")
              .data([selectedTreatment])
              .join("text")
              .attr("class", "xAxis")
              .attr("text-anchor", "middle")
              .attr("x", chartWidth / 2 + layout.marginLeft)
              .attr("y", layout.height - 3)
              .style("font-size", "9px")
              .style("font-family", "sans-serif")
              .text(d => d)

    xAxis.selectAll(".tick")
     .attr("font-size","8px")

    svgElement.selectAll(".yAxis")
              .data([selectedOutcome])
              .join("text")
              .attr("class", "yAxis")
              .attr("text-anchor", "middle")
              .attr("transform", "rotate(-90)")
              .attr("y", 10)
              .attr("x", -layout.height / 2)
              .style("font-size", "9px")
              .style("font-family", "sans-serif")
              .text(d => d)

    d3.selectAll(".tick>text")
      .style("font-size", 8)
    
  }, [dataset, selectedTreatment, selectedOutcome, regressionLines, validClusters, ATE, deselected, clusterAppearance])
  

  return (
  <div className={classes.lmLayout}>
    <h3 className={classes.title}>{'Ave. Treatment Effect: ' + ATE.toFixed(2)}</h3>
    <p className={classes.subtitle}>{'[all clusters] Ave. Treatment Effect: ' + overallATE.toFixed(2)}</p>
    <div className={classes.lmContent}>
      <svg width={layout.width} height={layout.height} ref={ref}>
        <g />
        <g transform={"translate(" + 0 + "," + (layout.height - layout.marginDefault) + ")"} id="xAxis" />
        <g transform={"translate(" + layout.marginLeft + "," + 0 + ")"} id="yAxis" />
      </svg>
      <div className={classes.menu}>
        {/*<div className={classes.button}>
          <IconButton>
            <Autorenew />
          </IconButton>
          <p className={classes.buttonText}>Update Vis</p>
        </div>*/}
      </div>
    </div>
  </div>
)}