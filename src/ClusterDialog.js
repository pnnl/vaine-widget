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

import React, {useEffect, useState} from 'react'
import * as d3 from 'd3'

import { Histogram } from './Histogram'
import { CollapseSelectors } from './CollapseSelectors'

import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import Input from '@material-ui/core/Input'

import { SwatchesPicker } from 'react-color'

import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles((theme) => ({
  dialogLayout: {
    display: "flex",
    alignItems: "flex-start",
  },
  dialogTitle: {
    display: "flex",
    alignItems: "center",
    padding: "16px 24px"
  },
  matrix: {
    display: "grid",
    gridTemplateColumns: 'auto auto auto auto',
    gridTemplateRows: 'auto auto auto',
    marginLeft: "50px"
  },
  swatchMini: {
    padding: '5px',
    background: '#fff',
    borderRadius: '1px',
    boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
    display: 'inline-block',
    cursor: 'pointer',
    marginLeft: 15
  },
  swatchColor: {
    width: '36px',
    height: '14px',
    borderRadius: '2px',
  },
  swatch: {
    position: 'absolute',
    zIndex: 2
  }
}))

// Displays details of a particular cluster
export const ClusterDialog = ({data, dataset, ignore=[], clusterName={}, clusterAppearance={}, selectedTreatment, selectedOutcome, selectedCluster='', validClusters, onSelect, updateClusterAppearance, updateClusterName, onClose, isOpen=false}) => {
  const classes = useStyles()

  const [covariates, setCovariates] = React.useState({})
  const [selectedCovariates, setSelectedCovariates] = React.useState([])

  const [showColorPicker, setShowColorPicker] = React.useState(false)
  const [color, setColor] = React.useState('gray')

  const [name, setName] = React.useState(clusterName[selectedCluster] ? clusterName[selectedCluster].name : selectedCluster)

  // Determine cluster color
  useEffect(() => {
    const newClusterColor = clusterAppearance[selectedCluster] ? clusterAppearance[selectedCluster].color : 'gray'
    setColor(newClusterColor)
  }, [clusterAppearance, selectedCluster])

  // Determine cluster name
  useEffect(() => {
    setName(clusterName[selectedCluster] ? clusterName[selectedCluster].name : selectedCluster)
  }, [selectedCluster])

  // Determine all covariates available
  // Default to showing the first 8
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
      if (i < 8) {
        newCovariates[c] = true
        newSelectedCovariates.push(c)
      } else {
        newCovariates[c] = false
      }
    }

    setCovariates(newCovariates)
    setSelectedCovariates(newSelectedCovariates)

  }, [data, selectedTreatment, selectedOutcome])

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

  // Toggle color picker
  const handleColorClick = () => {
    setShowColorPicker(!showColorPicker)
  }

  // Close color picker
  const handleColorClose = () => {
    setShowColorPicker(false)
  }

  // Update cluster color on user customization
  const handleColorChange = (color) => {
    updateClusterAppearance(selectedCluster, color.hex)
  }

  // Update cluster name
  const onInputChange = (e) => {
    e.preventDefault()
    e.stopPropagation()

    const newName = e.target.value

    setName(newName)
  }

  // Close cluster dialog
  const handleClose = () => {
    updateClusterName(selectedCluster, name)
    onClose()
  }

  // Update selected clusters if user chooses to deselect current cluster
  const handleDeselect = () => {
    let newSelected = JSON.parse(JSON.stringify(validClusters))

    newSelected[selectedCluster] = false

    onSelect(newSelected)
    updateClusterName(selectedCluster, name)
    onClose()
  }

  return (
    <div>
      <Dialog
        open={isOpen}
        onClose={handleClose}
        fullWidth
        maxWidth={'xl'}
      >
        <div className={classes.dialogTitle}>
          <Input
            className={classes.textfield}
            value={name}
            onChange={(e) => onInputChange(e)}
          />
          <div className={classes.swatchMini} onClick={handleColorClick}>
            <div className={classes.swatchColor} style={{ 'background': color }}/>
            {showColorPicker ? <SwatchesPicker className={classes.swatch}
                                               color={color}
                                               onClick={handleColorClose}
                                               onChange={handleColorChange} /> : null}
          </div>
        </div>
        <DialogContent className={classes.dialogLayout}>
          <CollapseSelectors options={covariates} sortedClusters={Object.keys(covariates)} title="Covariates" showColor={false} onSelect={onSelectCovariate} />
          <div className={classes.matrix}>
            {selectedCovariates.map(c => (<Histogram 
              dataSubset={dataset} 
              covariate={c} 
              cluster={selectedCluster} />
            ))}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeselect} color="primary" autoFocus>
            DESELECT
          </Button>
          <Button onClick={handleClose} color="primary" autoFocus>
            CLOSE
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}