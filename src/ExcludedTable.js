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
import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TablePagination from '@material-ui/core/TablePagination'
import TableRow from '@material-ui/core/TableRow'
import Paper from '@material-ui/core/Paper'

import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles({
	treatmentOutcome: {
		fontSize: 15,
		color: '#505050',
    	fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif;',
	},
	cell: {
		maxWidth: 300,
		whiteSpace: "nowrap",
		overflow: "hidden",
		textOverflow: "ellipsis",
	},
	datarow: {
		"&:hover": {
      backgroundColor: '#f8f8f8',
      "& $putback": {
        opacity: 1,
      },
    },
	},
	putback: {
		opacity: 0,
		fontSize: 8,
		color: '#3f51b5',
		cursor: 'pointer',
		"&:hover": {
			opacity: 1,
		},
	},
})

// Table of excluded points
export const ExcludedTable = ({isOpen, excluded, toggleOpen, onInclude}) => {
	const classes = useStyles()

	const [headers, setHeaders] = React.useState({})

	// Determine headers for selected treatment/outcome
	useEffect(() => {
		let newHeaders = JSON.parse(JSON.stringify(headers))

		for (let to of Object.keys(excluded)) {
			const toHeaders = Object.keys(excluded[to][0])
			newHeaders[to] = [''].concat(toHeaders)
		}
		setHeaders(newHeaders)
	}, [excluded])

  return (
		<Dialog
			fullWidth
			maxWidth={'xl'}
			open={isOpen}
			aria-labelledby="alert-dialog-title"
			aria-describedby="alert-dialog-description"
		>
			<DialogContent>
				<div className={classes.root}>
					{Object.keys(excluded).map((e) => (
						<div>
							<h3 className={classes.treatmentOutcome}>{e.split('|').join(' ')}</h3>
							<TableContainer className={classes.container}>
								<Table stickyHeader className={classes.table} aria-label="simple table">
									<TableHead>
										<TableRow>
											{headers[e] ? headers[e].map((h) => 
												<TableCell className={classes.cell}>{h}</TableCell>
											) : null}
										</TableRow>
									</TableHead>
									<TableBody>
										{excluded[e].map((row) => {
											return (<TableRow className={classes.datarow}>
												<TableCell><p className={classes.putback} onClick={() => onInclude(row, e)}>put back</p></TableCell>
												{Object.keys(row).map((variable) => {
													return <TableCell className={classes.cell} component="th" scope="row">
														{ row[variable] }
													</TableCell>
												})}
											</TableRow>)
										})}
									</TableBody>
								</Table>
							</TableContainer>
						</div>
					))}
				</div>
			</DialogContent>
			<DialogActions>
				<Button onClick={toggleOpen} color="primary">
					CLOSE
				</Button>
			</DialogActions>
		</Dialog>
	  );
}