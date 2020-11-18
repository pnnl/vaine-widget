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

import React, {useState, useEffect} from 'react'
import * as d3 from 'd3'

import Checkbox from '@material-ui/core/Checkbox'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles((theme) => ({
  selectorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    maxWidth: 150,
    marginRight: 25
  },
  selectorCheckbox: {
    padding: 0,
    margin: "3px 9px 3px 0px",
    '& .MuiSvgIcon-root': {
      fontSize: '1rem',
    }
  },
  cluster: {
    display: 'flex',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif;',
    marginRight: 15,
    alignItems: 'center'
  },
  title: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif;',
    fontSize: 15,
    color: '#505050'
  },
  viewDetails: {
    marginLeft: 'auto',
    cursor: 'pointer',
    fontSize: 8,
    color: '#0645AD',
    verticalAlign: 'middle'
  },
  seeAll: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif;',
    fontSize: 8,
    cursor: 'pointer',
  },
  selectionName: {
    cursor: 'pointer',
    fontSize: 8
  },
}))

// Checkbox selectors, deprecated
export const Selectors = ({options={}, clusterName={}, clusterAppearance={}, onSelect, title, showDetails=false, onViewDetails}) => {
  const classes = useStyles()
  const [selected, setSelected] = React.useState(options)
  const [showNumber, setShowNumber] = React.useState(5)

  useEffect(() => {
    setSelected(options)
  }, [options])

  const handleChange = (event, s) => {
    let newSelected = JSON.parse(JSON.stringify(selected))
    const current = selected[s]

    if (!current) {
      newSelected[s] = true
    } else {
      newSelected[s] = false
    }

    setSelected(newSelected)
    onSelect(newSelected)
  }

  const toggleShow = () => {
    if (showNumber === 5) {
      setShowNumber(Object.keys(options).length)
    } else {
      setShowNumber(5)
    }
  }

  return (
    <div className={classes.selectorContainer}>
      {title ? <h3 className={classes.title}>{title}</h3> : null}
      {Object.keys(options).slice(0, showNumber).map((c) => (
        <div className={classes.cluster}>
          <Checkbox
            className={classes.selectorCheckbox}
            checked={selected[c] ? selected[c] : false}
            style={clusterAppearance[c] ? {color: clusterAppearance[c].color} : {color: "gray"}}
            onChange={(e) => handleChange(e, c)}
            inputProps={{ 'aria-label': 'primary checkbox' }}
          />
          {showDetails ?
            <p className={classes.selectionName} 
             title='view details'
             onClick={() => onViewDetails(c)}
             style={clusterAppearance[c] ? {color: clusterAppearance[c].color} : {color: "gray"}}>
            {clusterName[c] ? clusterName[c].name : c}
            </p> :
            <p className={classes.selectionName} 
             style={clusterAppearance[c] ? {color: clusterAppearance[c].color} : {color: "gray"}}>
            {clusterName[c] ? clusterName[c].name : c}
            </p>
          }
          
        </div>
      ))}
      {Object.keys(options).length > 5 ? <p className={classes.seeAll} onClick={() => toggleShow()}>{'Show all ' + Object.keys(options).length}</p> : null}
    </div>
  )
}
