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

import React, { useState, useEffect } from 'react'

import ButtonGroup from '@material-ui/core/ButtonGroup'
import Button from '@material-ui/core/Button'
import Input from '@material-ui/core/Input'

import Add from '@material-ui/icons/Add'
import Remove from '@material-ui/icons/Remove'

import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles((theme) => ({
  numberInput: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif;',
    fontSize: 8,
  },
  root: {
    '& .MuiButtonGroup-root': {
      border: 0
    },
    '& .MuiInput-root': {
      width: 15,
      height: 20
    },
    '& .MuiInput-input': {
      textAlign: "center",
      fontSize: 8,
    },
    '& .MuiButton-root': {
      border: "0px",
      color: "gray",
      height: 20,
    },
    borderBottom: "1px solid gray",
    marginLeft: "10px"
  },
}));

// Number input field for customizing number of clusters
export const NumberInput = ({min=1, currentValue=10, onChange}) => {
  const classes = useStyles()

  const [isError, setIsError] = React.useState(false)
  const [value, setValue] = React.useState(currentValue)

  useEffect(() => {
    setValue(currentValue)
  }, [currentValue])

  // Update value on user input
  const onInputChange = (e) => {
    e.preventDefault()
    e.stopPropagation()

    const newValue = e.target.value

    setValue(newValue)
  }

  // Validate that user input is an int
  const handleChange = () => {
    const newValue = parseInt(value)
    if (isNaN(newValue)) {
      setIsError(true)
      return
    } else if (newValue < min) {
      setIsError(true)
      return
    }
    onChange(newValue)
  }

  // Increment/decrement feature has been removed
  // These functions are kept in case of future use
  const increment = () => {
    const newValue = value + 1
    onChange(newValue)
  }

  const decrement = () => {
    if (value === min) { return }
    const newValue = value - 1
    onChange(newValue)
  }

  return (
    <div className={classes.numberInput}>
      {'Number of Clusters'}
      <form className={classes.root} noValidate autoComplete="off">
        <div className={classes.numberContainer}
          onKeyPress={(ev) => {
            if (ev.key === 'Enter') {
              handleChange()
              ev.preventDefault()
            }
          }}>
          <ButtonGroup className={classes.button} color="primary">
            {/*<Button onClick={() => decrement()}>
              -
            </Button>*/}
            <Input
              error={isError}
              disableUnderline
              className={classes.textfield}
              id="outlined-error-helper-text"
              value={value}
              onChange={(e) => onInputChange(e)}
            />
          {/*<Button className={classes.button} onClick={() => increment()}>
            +
          </Button>*/}
          </ButtonGroup>
        </div>
      </form>
    </div>
  )
}