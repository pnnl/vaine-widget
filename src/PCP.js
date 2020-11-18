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
import crossfilter from 'crossfilter2'

import { CollapseSelectors } from './CollapseSelectors'

import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles((theme) => ({
  PCPcontainer: {
    marginLeft: 0,
    display: "flex",
    flexDirection: "column"
  },
}))

// Visualize covariates in a parallel coordinates plot
export const PCP = ({data, regressions, ignore=[], selectedTreatment, selectedOutcome, validClusters, deselected=[], clusterAppearance={}, onDeselect}) => {
  const classes = useStyles()
  const ref = useRef('pcp')

  const [dataset, setDataset] = React.useState([])

  const [covariates, setCovariates] = React.useState({})
  const [selectedCovariates, setSelectedCovariates] = React.useState([])

  const [selectedData, setSelectedData] = React.useState({})
  const [deselectedData, setDeselectedData] = React.useState({})
  const [yExtents, setYExtents] = React.useState({})

  const [unionSelect, setUnionSelect] = React.useState(false)

  // Get all included points
  useEffect(() => {
    let newDataset = []
    for (let r of Object.keys(regressions)) {
      newDataset = newDataset.concat(regressions[r].included)
    }

    setDataset(newDataset)
  }, [regressions])

  // Determine selected and deselected data
  useEffect(() => {
    const isDeselected = (d) => {
      const cluster = d.cluster
      if (!validClusters[cluster]) { return true }

      const index = d.index
      if (deselected.indexOf(index) > -1) { return true }

      return false
    }

    const newDeselectedData = dataset.filter(d => isDeselected(d))
    const newSelectedData = dataset.filter(d => !isDeselected(d))

    setDeselectedData(newDeselectedData)
    setSelectedData(newSelectedData)
  }, [deselected, dataset, validClusters])

  // Determine all covariates available
  // Default to showing the first 5
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
      if (i < 5) {
        newCovariates[c] = true
        newSelectedCovariates.push(c)
      } else {
        newCovariates[c] = false
      }
    }

    setCovariates(newCovariates)
    setSelectedCovariates(newSelectedCovariates)
  }, [data, selectedTreatment, selectedOutcome])

  // Track brushed extents of each covariate
  useEffect(() => {
    const filterSelection = () => {
      let newCF = crossfilter(dataset)
      let crossfilterDimensions = {}

      let currentSelection = []

      for (let c of selectedCovariates) {

        const dimensionExtent = yExtents[c]

        if (!dimensionExtent) { continue }
        let newDimension = newCF.dimension(d => d[c])
        newDimension.filter(d => d >= dimensionExtent[0] && d <= dimensionExtent[1])
        currentSelection = newDimension.top(Infinity)
      }

      return currentSelection
    }

    const currentSelections = filterSelection()
    if (currentSelections.length === dataset.length) {
      onDeselect([], 'pcp', true)
      return
    }
    const currentBrushedIndices = currentSelections.map(d => d.index)

    const nonBrushed = dataset.filter(d => currentBrushedIndices.indexOf(d.index) === -1)
    const nonBrushedIndices = nonBrushed.map(d => d.index)

    onDeselect(nonBrushedIndices, 'pcp', unionSelect)
  }, [yExtents])

  // Update covariates shown on user select
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

  const layout = {"width":615,
                  "height":350,
                  "marginDefault":60,
                  "marginBottom": 10}
  
  useEffect(() => {
    const svgElement = d3.select(ref.current)

    svgElement.selectAll("rect.selection").attr("width", 16).attr("x", bandWidth - 8)
    
    const g = svgElement.select("#pcpSelected")
    const gAxis = svgElement.select("#pcpAxes")
    const gDeselected = svgElement.select("#pcpDeselected")

    const svgWidth = +svgElement.attr('width')
    const svgHeight = +svgElement.attr('height')

    const chartWidth = svgWidth - layout.marginDefault * 2
    const chartHeight = svgHeight - (layout.marginDefault + layout.marginBottom)

    let yScales = {}

    for (let m of selectedCovariates) {
      let metricScale
      let domain
      domain = d3.extent(dataset, d => d[m])
      metricScale = d3.scaleLinear().range([chartHeight, 0]).domain(domain).nice()
      
      yScales[m] = metricScale.domain(domain)
    }

    let xScale = d3.scalePoint()
        .range([0, chartWidth])
        .domain(selectedCovariates)

    const maxTextLength = 15

    let textData = []

    // Divide long covariate names into multiple lines
    for (let m of selectedCovariates) {
      if (m.length < maxTextLength) {
        textData.push({'text': m, 'x': xScale(m), 'y': -9})
      } else if (m.split(" ").length === 1) {
        textData.push({'text': m, 'x': xScale(m), 'y': -9})
      } else {
        const splitCovariate = m.split(" ")

        let mergeSplits = []
        let currentSplit = ''

        for (let s of splitCovariate) {
          if (s.length > maxTextLength) {
            mergeSplits.push(currentSplit)
            mergeSplits.push(s)
            currentSplit = ''
          } else {
            currentSplit = currentSplit + ' ' + s
          }

          if (currentSplit.length > maxTextLength) {
            mergeSplits.push(currentSplit)
            currentSplit = ''
          }
        }

        if (currentSplit !== '') { mergeSplits.push(currentSplit) }

        let currentY = -9 * mergeSplits.length

        for (let ms of mergeSplits) {
          textData.push({'text': ms, 'x': xScale(m), 'y': currentY})
          currentY = currentY + 9
        }
      }
    }

    function pathConfirmed(d) {
        return d3.line()(selectedCovariates.map(p => [xScale(p), yScales[p](d[p])]))
    }

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10)
                         .domain(d3.map(dataset, function(d){return d.cluster}).keys().sort())

    const fillColor = (d) => {
      const cluster = d.cluster
      if (!validClusters[cluster]) { return 'lightgray' }

      const index = d.index
      if (deselected.indexOf(index) > -1) { return 'lightgray' }

      return clusterAppearance[cluster] ? clusterAppearance[cluster].color : 'lightgray'
    }

    const opacity = (d) => {
      const cluster = d.cluster
      if (!validClusters[cluster]) { return 0 }

      const index = d.index
      if (deselected.indexOf(index) > -1) { return 0 }

      return 0.3
    }

    gDeselected.selectAll(".deselectedPath")
      .data(deselectedData)
      .join("path")
      .attr("class", "deselectedPath")
      .attr("d",  pathConfirmed)
      .style("fill", "none")
      .style("stroke", 'lightgray')
      .style("opacity", 0.3)

    g.selectAll(".strokePath")
      .data(selectedData)
      .join("path")
      .attr("class", "strokePath")
      .attr("d",  pathConfirmed)
      .style("fill", "none")
      .style("stroke", d => fillColor(d))
      .style("opacity", d => opacity(d))

    gAxis.selectAll(".myAxis")
      .data(selectedCovariates)
      .join("g")
      .attr("class", "myAxis")
      .attr("transform", function(d) { return "translate(" + xScale(d) + ")"; })
      .each(function(d) {
        d3.select(this).call(d3.axisLeft().scale(yScales[d]))
      })

    g.selectAll(".myText")
      .data(textData)
      .join("text")
      .attr("class", "myText")
      .attr("transform", function(d) { return "translate(" + d.x + ")"; })
      .attr("y", d => d.y)
      .text(function(d) { return d.text })
      .style("text-anchor", "middle")
      .style("fill", "black")
      .style("font-size", 8)
      .style("font-family", '"Roboto", "Helvetica", "Arial", sans-serif')

    d3.selectAll(".tick>text")
      .style("font-size", 8)

    const bandWidth = xScale.step() / 2

    // Set brush size to 16px width
    const brushstart = () => {
      svgElement.selectAll("rect.selection").attr("width", 16).attr("x", bandWidth - 8)
      d3.event.sourceEvent.stopPropagation()
    }

    const brush = (d) => {
      svgElement.selectAll("rect.selection").attr("width", 16).attr("x", bandWidth - 8)
    }

    // Determine which points are selected
    // Update deselected points
    // If `command` (meta) key is held down, perform union select
    const brushend = (d) => {
      svgElement.selectAll("rect.selection").attr("width", 16).attr("x", bandWidth - 8)
      d3.event.sourceEvent.stopPropagation()

      let newYExtents = JSON.parse(JSON.stringify(yExtents))

      if (d3.event.selection === null) {
        newYExtents[d] = d3.extent(dataset, datum => datum[d])
      } else {
        const scale = yScales[d]

        const covariateUpperBound = scale.invert(d3.event.selection[0])
        const covariateLowerBound = scale.invert(d3.event.selection[1])

        newYExtents[d] = [covariateLowerBound, covariateUpperBound]
      }

      setUnionSelect(d3.event.sourceEvent.metaKey)
      setYExtents(newYExtents)
    }

    // Attach brush for each covariate
    gAxis.selectAll(".brush")
      .data(selectedCovariates)
      .join("g")
      .attr("class", "brush")
      .attr("transform", d => "translate(" + (xScale(d) - bandWidth) + ")")
      .each(function(d) {
        d3.select(this).call(yScales[d].brush = d3.brushY()
                                                  .on("start", brushstart)
                                                  .on("brush", () => brush(d))
                                                  .on("end", () => brushend(d)))

        svgElement.selectAll("rect.selection").attr("width", 16).attr("x", bandWidth - 8)
      })
    
  }, [dataset, deselected, selectedData, deselectedData, covariates, selectedCovariates, validClusters])
  
  return <div className={classes.PCPcontainer}>
    <div className={classes.selectorContainer}>
      <CollapseSelectors options={covariates}
                         sortedClusters={Object.keys(covariates)}
                         showColor={false}
                         onSelect={onSelectCovariate}
                         title="Covariates" />
    </div>
    <svg width={layout.width} height={layout.height} ref={ref} id="pcp">
        <g transform={"translate(" + layout.marginDefault + "," +  layout.marginDefault + ")"} id="pcpDeselected"/>
        <g transform={"translate(" + layout.marginDefault + "," +  layout.marginDefault + ")"} id="pcpSelected"/>
        <g transform={"translate(" + layout.marginDefault + "," +  layout.marginDefault + ")"} id="pcpAxes"/>
    </svg>
  </div>
}