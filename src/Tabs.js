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
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'

import GetApp from '@material-ui/icons/GetApp'
import Settings from '@material-ui/icons/Settings'
import ViewList from '@material-ui/icons/ViewList'
import VisibilityOff from '@material-ui/icons/VisibilityOff'

import clsx from 'clsx'

import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import Divider from '@material-ui/core/Divider'
import Drawer from '@material-ui/core/Drawer'
import IconButton from '@material-ui/core/IconButton'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListSubheader from '@material-ui/core/ListSubheader'
import ListItemIcon from '@material-ui/core/ListItemIcon'
import ListItemText from '@material-ui/core/ListItemText'
import Tab from '@material-ui/core/Tab'
import Tabs from '@material-ui/core/Tabs'
import TextField from '@material-ui/core/TextField'

import { ExcludedTable } from './ExcludedTable'
import { RadioSelectors } from './RadioSelectors'

const useStyles = makeStyles((theme) => ({
  tabs: {
    marginBottom: 15,
    display: 'flex',
  },
  inputBox: {
    width: '450px',
    marginBottom: '25px'
  },
  tabButtonFirst: {
    marginLeft: 'auto',
  },
  tabButtonDivide: {
    borderRight: `1px solid ${theme.palette.divider}`,
  },
  tabButton: {
    fontSize: '8px',
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif;',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 15,
    width: 80,
    overflow: 'hidden'
  },
  tabTitle: {
    margin: 0,
    cursor: 'pointer',
    color: 'gray'
  },
  tabIcon: {
    padding: '0px',
    color: 'gray',
  },
  tabTitleDownload: {
    color: 'black'
  },
  tabIconDownload: {
    color: 'black'
  },
}));

// Tabs for some additional functionality
export const MenuTabs = ({pThreshold, onChangeP, excluded, onExclude, onInclude, onSave}) => {
  const classes = useStyles()

  const [state, setState] = React.useState({ right: false, })
  const [excludedTableOpen, setExcludedTableOpen] = React.useState(false)

  // Track which drawer is open, if any
  const toggleDrawer = (anchor, open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }

    setState({ ...state, [anchor]: open })
  }

  // Toggle show table of excluded points
  const toggleExcludedTable = () => {
    setExcludedTableOpen(!excludedTableOpen)
  }

  return (
    <div>
      <div
        className={classes.tabs}
      >
        <div className={classes.tabButton} onClick={() => onExclude()}>
          <Tab className={classes.tabIcon} icon={<VisibilityOff />}/>
          <p className={classes.tabTitle}>EXCLUDE</p>
        </div>
        <div className={`${classes.tabButtonFirst} ${classes.tabButton}`} onClick={() => toggleExcludedTable()}>
          <Tab className={classes.tabIcon} icon={<ViewList />}/>
          <p className={classes.tabTitle}>VIEW EXCLUDED</p>
        </div>
        <div className={`${classes.tabButtonDivide} ${classes.tabButton}`} onClick={toggleDrawer('more', true)}>
          <Tab className={classes.tabIcon} icon={<Settings />}/>
          <p className={classes.tabTitle}>SETTINGS</p>
        </div>
        <div className={classes.tabButton} onClick={() => onSave()}>
          <Tab className={`${classes.tabIcon} ${classes.tabIconDownload}`} icon={<GetApp />}/>
          <p className={`${classes.tabTitle} ${classes.tabTitleDownload}`}>DOWNLOAD</p>
        </div>
      </div>
      <Drawer anchor={'right'} open={state['more']} onClose={toggleDrawer('more', false)}>
        <ListSubheader
          className={classes.listSubheader}
          component="div"
          id="nested-list-subheader">
            More Settings
        </ListSubheader>
        <ListItem>
          <RadioSelectors originalValue={pThreshold} title='alpha' onChange={onChangeP} />
        </ListItem>
      </Drawer>
      <ExcludedTable isOpen={excludedTableOpen}
                     excluded={excluded}
                     toggleOpen={toggleExcludedTable}
                     onInclude={onInclude} />
    </div>
  );
}
