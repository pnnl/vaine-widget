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

const useStyles = makeStyles((theme) => ({
  chart: {
  },
}))

// Visualize data distribution of each covariate
export const Histogram = ({dataSubset, covariate, cluster}) => {
  const classes = useStyles()
  const ref = useRef('histogram' + covariate + cluster)
  
  //For now, assume margin is equal all around the graph
  //Do not change these variables anywhere else
  const layout = {"width":225,
                  "height":225,
                  "margin":35}
  
  useEffect(() => {
    const svgElement = d3.select(ref.current)
    
    const g = svgElement.select("g")

    const chartHeight = layout.height-(layout.margin * 2)
    const chartWidth = layout.width-(layout.margin * 2)
    
    const xScale = d3.scaleLinear()
                     .domain(d3.extent(dataSubset, d => d[covariate])).nice()
                     .range([0, chartWidth])
        
    const bins = d3.histogram()
                   .value(function(d) { return d[covariate] })
                   .domain(xScale.domain())
                   .thresholds(xScale.ticks(10))
                   (dataSubset)

    const yScale = d3.scaleLinear()
                     .domain([0, d3.max(bins, d => d.length)]).nice()
                     .range([chartHeight, 0])

    const bars = g.selectAll("rect")
                  .data(bins)
                  .join("rect")
                  .attr("x", d => xScale(d.x0) + 1)
                  .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
                  .attr("y", d => yScale(d.length))
                  .attr("height", d => yScale(0) - yScale(d.length))
                  .attr("fill", "gray")

    svgElement.selectAll("text")
              .data([covariate])
              .join("text")
              .attr("text-anchor", "middle")
              .attr("x", layout.width / 2)
              .attr("y", layout.height - 6)
              .style("font-size", "10px")
              .style("font-family", "sans-serif")
              .text(d => d)

    svgElement.selectAll(".yAxis")
              .data(['frequency'])
              .join("text")
              .attr("class", "yAxis")
              .attr("text-anchor", "middle")
              .attr("transform", "rotate(-90)")
              .attr("y", 10)
              .attr("x", -layout.height / 2)
              .style("font-size", "10px")
              .style("font-family", "sans-serif")
              .text(d => d)

    svgElement.append('g')
              .attr('transform', `translate(${layout.margin}, ${layout.height - layout.margin})`)
              .call(d3.axisBottom(xScale).tickSize(3).ticks(5))

    svgElement.append('g')
              .attr('transform', `translate(${layout.margin}, ${layout.margin})`)
              .call(d3.axisLeft(yScale).tickSize(3).ticks(5))
    
  }, [dataSubset, covariate, cluster])
  
  return <div className={classes.chart}>
    <svg width={layout.width} height={layout.height} ref={ref}>
        <g transform={"translate(" + layout.margin + "," +  layout.margin + ")"} />
    </svg>
  </div>
}