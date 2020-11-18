import React, { useState } from 'react'
import { action } from '@storybook/addon-actions'

import * as d3 from 'd3'

import { formatData } from '../src/helperFunctions/formatData'
import { formatStats } from '../src/helperFunctions/formatStats'

import { BeeSwarm } from '../src/BeeSwarm'
import { CoarsenedEmbedding } from '../src/CoarsenedEmbedding'
import { CoarsenedLmplot } from '../src/CoarsenedLmplot'
import { PCP } from '../src/PCP'

import { clusterStats } from '../src/helperFunctions/clusterStats'
import { processData } from '../src/helperFunctions/processData'
import { realizeClusters } from '../src/helperFunctions/realizeClusters'

import props from './data/props.json'

export default {
  title: 'Charts',
};

const data = props.data
const treatments = props.treatments
const outcomes = props.outcomes
const ignore = props.ignore
const latentRepresentation = props.latentRepresentation

const clusters = realizeClusters({'n': 10, 'parents':latentRepresentation[treatments[0]].parents})
const clustersByPoint = clusters.byPoint
const embeddings = latentRepresentation[treatments[0]].points
const dataset = processData(data, ignore, clustersByPoint, embeddings)
const excluded = []

const allClusters = d3.map(dataset, function(d){return d.cluster}).keys()
const regressions = clusterStats(dataset, excluded, allClusters, treatments[0], outcomes[0])

let validClusters = {}
for (let s of allClusters) {
  if (regressions[s].pvalue < 0.05) {
    validClusters[s] = true
  } else {
    validClusters[s] = false
  }
}

let validClusters2 = JSON.parse(JSON.stringify(validClusters))
validClusters2[1051] = false
validClusters2[1070] = false
validClusters2[1107] = false

export const EmbeddingTest = () => {
  return (
    <div>
      <CoarsenedEmbedding dataset={dataset}
                          selectedTreatment={treatments[0]}
                          regressions={regressions}
                          validClusters={validClusters} />
      <CoarsenedEmbedding dataset={dataset}
                          selectedTreatment={treatments[0]}
                          regressions={regressions}
                          validClusters={validClusters2} />
    </div>
)}

export const LmplotTest = () => {
  return (
    <div>
      <CoarsenedLmplot dataset={dataset}
                       selectedTreatment={treatments[0]}
                       selectedOutcome={outcomes[0]}
                       regressions={regressions}
                       validClusters={validClusters} />
      <CoarsenedLmplot dataset={dataset}
                       selectedTreatment={treatments[0]}
                       selectedOutcome={outcomes[0]}
                       regressions={regressions}
                       validClusters={validClusters2} />
    </div>
)}

export const PCPTest = () => {
  return (
    <div>
      <PCP data={data}
           dataset={dataset}
           ignore={ignore}
           selectedTreatment={treatments[0]}
           selectedOutcome={outcomes[0]}
           regressions={regressions}
           validClusters={validClusters} />
    </div>
)}

const originalVariables = data.columns
let allCovariates = []

for (let v of originalVariables) {
  if (v === treatments[0] || v === outcomes[0]) {
    continue
  } else if (ignore.indexOf(v) > -1) {
    continue
  } else {
    allCovariates.push(v)
  }
}

export const BeeSwarmTest = () => {
  return (
    <div>
      <BeeSwarm data={data}
                covariates={allCovariates.slice(0, 10)}
                ignore={ignore}
                selectedTreatment={treatments[0]}
                selectedOutcome={outcomes[0]}
                regressions={regressions}
                validClusters={validClusters} />
    </div>
)}
