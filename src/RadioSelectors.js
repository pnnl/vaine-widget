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
import { makeStyles } from '@material-ui/core/styles'

import FormControlLabel from '@material-ui/core/FormControlLabel'
import FormControl from '@material-ui/core/FormControl'
import FormLabel from '@material-ui/core/FormLabel'
import Radio from '@material-ui/core/Radio'
import RadioGroup from '@material-ui/core/RadioGroup'
import Slider from '@material-ui/core/Slider'
import Typography from '@material-ui/core/Typography'

const useStyles = makeStyles({
  root: {
    width: 250,
    marginLeft: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  text: {
    width: 220,
    fontSize: 10,
    marginBottom: 0
  },
  selection: {
    '& .MuiSvgIcon-root': {
      fontSize: '1rem',
    },
    '& .MuiTypography-body1': {
      fontSize: 9
    }
  },
})

// Radio selectors for setting alpha value
export const RadioSelectors = ({originalValue=0.05, title, onChange, min=0, max=1, step=0.01}) => {
  const classes = useStyles()

  const [currentValue, setCurrentValue] = React.useState(originalValue)

  useEffect(() => {
    const inverseValueMap = {0.01: "0.01", 0.05: "0.05", 1:"1"}
    setCurrentValue(inverseValueMap[originalValue])
  }, [originalValue])

  // Update value on user select
  const handleChange = (event) => {
    const valueMap = {"0.01": 0.01, "0.05": 0.05, "1": 1}
    onChange(valueMap[event.target.value])
  }

  return <div className={classes.root}>
      <Typography className={classes.text} id="continuous-slider" gutterBottom>
      {title}
      </Typography>
      <RadioGroup value={currentValue} onChange={handleChange}>
        <FormControlLabel className={classes.selection} value={"0.01"} control={<Radio />} label="0.01" />
        <FormControlLabel className={classes.selection} value={"0.05"} control={<Radio />} label="0.05" />
        <FormControlLabel className={classes.selection}value={"1"} control={<Radio />} label="1" />
      </RadioGroup>
    </div>
}
