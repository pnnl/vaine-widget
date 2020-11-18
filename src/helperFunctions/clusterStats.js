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

import * as regression from 'regression'
import * as jStat from 'jstat'

import { regress } from './regression'

function get_t_test(t_array1, t_array2){
	const meanA = jStat.mean(t_array1)
	const meanB = jStat.mean(t_array2)
	const S2=(jStat.sum(jStat.pow(jStat.subtract(t_array1,meanA),2)) + jStat.sum(jStat.pow(jStat.subtract(t_array2,meanB),2)))/(t_array1.length+t_array2.length-2)
	const t_score = (meanA - meanB)/Math.sqrt(S2/t_array1.length+S2/t_array2.length)
	const t_pval = jStat.studentt.cdf(-Math.abs(t_score), t_array1.length+t_array2.length-2) * 2

	return [t_score, t_pval]
}

// Calculate relevant stats for each cluster
export const clusterStats = (dataset, excluded, validClusters, selectedTreatment, selectedOutcome) => {

	const excludedIndices = excluded.map(e => e.index)

	const newRegressions = {}

	for (let c of validClusters) {
		const clusterPoints = dataset.filter(p => p.cluster == c)

		const includedPoints = clusterPoints.filter(p => excludedIndices.indexOf(p.index) === -1)
		const excludedPoints = clusterPoints.filter(p => excludedIndices.indexOf(p.index) > -1)

		const clusterCoords = includedPoints.map(p => [p[selectedTreatment], p[selectedOutcome]])

		const clusterX = includedPoints.map(p => p[selectedTreatment])
		const clusterY = includedPoints.map(p => p[selectedOutcome])

		const clusterRegression = regression.linear(clusterCoords)
		const regressionStats = regress(clusterX, clusterY)

		clusterRegression.rvalue = regressionStats.r
		clusterRegression.see = regressionStats.see
		clusterRegression.pvalue = get_t_test(clusterX, clusterY)[1]

		clusterRegression.included = includedPoints
		clusterRegression.excluded = excludedPoints

		newRegressions[c] = clusterRegression
	}

	return newRegressions
}