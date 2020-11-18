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

import React from 'react'

import Autocomplete from '@material-ui/lab/Autocomplete'

import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormControl from '@material-ui/core/FormControl'
import FormLabel from '@material-ui/core/FormLabel'
import TextField from '@material-ui/core/TextField'

import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles((theme) => ({
  root: {
    '& .MuiAutocomplete-option': {
      fontSize: 10
    }
  },
  autocomplete: {
    display: 'flex',
    width: '150px',
    flexWrap: 'wrap',
  },
  textfield: {
    '& .MuiInputBase-input': {
      fontSize: 10
    },
    '& .MuiFormLabel-root': {
      fontSize: 10
    },
  },
}))

// Autocomplete dropdown menus for selecting treatment and outcome options
export const SelectCondition = ({options, currentSelected, title, onSelect}) => {
  const classes = useStyles()

  const [value, setValue] = React.useState(currentSelected);

  // Update value on user select
  const handleChange = (event, newValue) => {
    setValue(newValue)
    onSelect(newValue)
  }

  return (
    <FormControl component="fieldset" className={classes.root}>
      <Autocomplete
        className={classes.autocomplete}
        id="auto-complete"
        autoComplete
        disableClearable
        includeInputInList
        value={currentSelected}
        options={options}
        onChange={(event, newValue) => {
          handleChange(event, newValue)
        }}
        renderInput={(params) => <TextField {...params}
                                            className={classes.textfield}
                                            label={title}
                                            margin="normal" />}
      />
    </FormControl>
  )
}