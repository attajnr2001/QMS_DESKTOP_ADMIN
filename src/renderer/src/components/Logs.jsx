import React, { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Typography,
  TableSortLabel,
  Box,
  CircularProgress,
  TextField
} from '@mui/material'
import {
  collection,
  query,
  orderBy as firestoreOrderBy,
  limit,
  onSnapshot,
  where,
  Timestamp
} from 'firebase/firestore'
import { db } from '../helpers/firebase' // Make sure to import your Firebase config

const Logs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortField, setSortField] = useState('timestamp')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    const fetchLogs = () => {
      const logsRef = collection(db, 'logs')
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)

      const q = query(
        logsRef,
        where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
        where('timestamp', '<=', Timestamp.fromDate(endOfDay)),
        firestoreOrderBy(sortField, sortOrder),
        limit(100)
      )

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedLogs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate().toLocaleString() || 'N/A'
          }))
          setLogs(fetchedLogs)
          setLoading(false)
        },
        (error) => {
          console.error('Error fetching logs:', error)
          setLoading(false)
        }
      )

      return unsubscribe
    }

    setLoading(true)
    const unsubscribe = fetchLogs()
    return () => unsubscribe()
  }, [selectedDate, sortField, sortOrder])

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleRequestSort = (property) => {
    const isAsc = sortField === property && sortOrder === 'asc'
    setSortOrder(isAsc ? 'desc' : 'asc')
    setSortField(property)
  }

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value)
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'INFO':
        return '#2196f3' // Blue
      case 'WARNING':
        return '#ff9800' // Orange
      case 'ERROR':
        return '#f44336' // Red
      default:
        return '#757575' // Grey
    }
  }

  if (loading) {
    return (
      <Box
        sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', m: 2 }}>
        <Typography variant="h5" fontWeight={'bold'}>
          Logs
        </Typography>
        <TextField
          label="Select Date"
          size="small"
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          sx={{ width: 220 }}
          InputLabelProps={{
            shrink: true
          }}
        />
      </Box>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="sticky table">
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'timestamp'}
                  direction={sortField === 'timestamp' ? sortOrder : 'asc'}
                  onClick={() => handleRequestSort('timestamp')}
                >
                  Timestamp
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'level'}
                  direction={sortField === 'level' ? sortOrder : 'asc'}
                  onClick={() => handleRequestSort('level')}
                >
                  Level
                </TableSortLabel>
              </TableCell>
              <TableCell>Message</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'email'}
                  direction={sortField === 'email' ? sortOrder : 'asc'}
                  onClick={() => handleRequestSort('email')}
                >
                  Email
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((log) => (
              <TableRow hover role="checkbox" tabIndex={-1} key={log.id}>
                <TableCell>{log.timestamp}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: getLevelColor(log.level),
                        marginRight: 1
                      }}
                    />
                    {log.level === 'ERROR' ? 'SEVERE' : log.level}
                  </Box>
                </TableCell>
                <TableCell>{log.message}</TableCell>
                <TableCell>{log.email}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={logs.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  )
}

export default Logs
