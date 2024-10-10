import React, { useState } from 'react'
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  TableSortLabel
} from '@mui/material'

const formatTime = (time) => {
  const [minutes, seconds] = time.split(':')
  const formattedSeconds = parseFloat(seconds).toFixed(2)
  return `${minutes}:${formattedSeconds.padStart(5, '0')}`
}

const VisitorTable = ({ rows, onSort, orderBy, order }) => {
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const createSortHandler = (property) => (event) => {
    onSort(property)
  }

  const getRowStyle = (waitTime, serviceTime) => {
    const waitMinutes = parseInt(waitTime.split(':')[0]) * 60 + parseFloat(waitTime.split(':')[1])
    const serviceMinutes =
      parseInt(serviceTime.split(':')[0]) * 60 + parseFloat(serviceTime.split(':')[1])

    if (waitMinutes > 60 || serviceMinutes > 30) {
      return { backgroundColor: '#dc143c27' } // Light red
    } else if (waitMinutes > 30 || serviceMinutes > 20) {
      return { backgroundColor: '#ffffcc' } // Light yellow
    }
    return {}
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead>
            <TableRow>
              <TableCell>Queue Code</TableCell>
              <TableCell>Teller</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'beganWaiting'}
                  direction={orderBy === 'beganWaiting' ? order : 'asc'}
                  onClick={createSortHandler('beganWaiting')}
                >
                  Began waiting
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'waitTime'}
                  direction={orderBy === 'waitTime' ? order : 'asc'}
                  onClick={createSortHandler('waitTime')}
                >
                  Wait time
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'serviceTime'}
                  direction={orderBy === 'serviceTime' ? order : 'asc'}
                  onClick={createSortHandler('serviceTime')}
                >
                  Service time
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={orderBy === 'timeSpent'}
                  direction={orderBy === 'timeSpent' ? order : 'asc'}
                  onClick={createSortHandler('timeSpent')}
                >
                  Time Spent
                </TableSortLabel>
              </TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
              <TableRow key={index} style={getRowStyle(row.waitTime, row.serviceTime)}>
                <TableCell>{row.queueCode}</TableCell>
                <TableCell>{row.teller}</TableCell>
                <TableCell>{row.service}</TableCell>
                <TableCell>
                  <Typography variant="body2" component="div">
                    {row.beganWaiting.split('\n')[0]}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.beganWaiting.split('\n')[1]}
                  </Typography>
                </TableCell>
                <TableCell>{formatTime(row.waitTime)}</TableCell>
                <TableCell>{formatTime(row.serviceTime)}</TableCell>
                <TableCell>{formatTime(row.timeSpent)}</TableCell>
                <TableCell>{row.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </>
  )
}

export default VisitorTable
