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
  TextField,
  Chip
} from '@mui/material'
import {
  collection,
  query,
  orderBy as firestoreOrderBy,
  limit,
  onSnapshot,
  where,
  Timestamp,
  getDocs
} from 'firebase/firestore'
import { db } from '../helpers/firebase' // Make sure to import your Firebase config

const Queues = () => {
  const [queues, setQueues] = useState([])
  const [tellers, setTellers] = useState({})
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [sortField, setSortField] = useState('joinedOn')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    const fetchTellers = async () => {
      const tellersRef = collection(db, 'tellers')
      const tellersSnapshot = await getDocs(tellersRef)
      const tellersData = {}
      tellersSnapshot.forEach((doc) => {
        tellersData[doc.id] = doc.data().name // Assuming the teller's name is stored in a 'name' field
      })
      setTellers(tellersData)
    }

    fetchTellers()
  }, [])

  useEffect(() => {
    const fetchQueues = () => {
      const queuesRef = collection(db, 'queues')
      const startOfDay = new Date(selectedDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(selectedDate)
      endOfDay.setHours(23, 59, 59, 999)

      const q = query(
        queuesRef,
        where('joinedOn', '>=', Timestamp.fromDate(startOfDay)),
        where('joinedOn', '<=', Timestamp.fromDate(endOfDay)),
        firestoreOrderBy(sortField, sortOrder),
        limit(100)
      )

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedQueues = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            joinedOn: doc.data().joinedOn?.toDate().toLocaleString() || 'N/A',
            completedOn: doc.data().completedOn?.toDate().toLocaleString() || 'N/A',
            startServingTime: doc.data().startServingTime?.toDate().toLocaleString() || 'N/A'
          }))
          setQueues(fetchedQueues)
          setLoading(false)
        },
        (error) => {
          console.error('Error fetching queues:', error)
          setLoading(false)
        }
      )

      return unsubscribe
    }

    setLoading(true)
    const unsubscribe = fetchQueues()
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

  const getStateColor = (state) => {
    switch (state.toLowerCase()) {
      case 'completed':
        return 'success'
      case 'serving':
        return 'warning'
      case 'waiting':
        return 'info'
      default:
        return 'default'
    }
  }

  const getTellerName = (tellerId) => {
    return tellers[tellerId] || 'Unknown'
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
          Queues
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
                  active={sortField === 'queueCode'}
                  direction={sortField === 'queueCode' ? sortOrder : 'asc'}
                  onClick={() => handleRequestSort('queueCode')}
                >
                  Queue Code
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'serviceName'}
                  direction={sortField === 'serviceName' ? sortOrder : 'asc'}
                  onClick={() => handleRequestSort('serviceName')}
                >
                  Service
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'joinedOn'}
                  direction={sortField === 'joinedOn' ? sortOrder : 'asc'}
                  onClick={() => handleRequestSort('joinedOn')}
                >
                  Joined On
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'startServingTime'}
                  direction={sortField === 'startServingTime' ? sortOrder : 'asc'}
                  onClick={() => handleRequestSort('startServingTime')}
                >
                  Serving Start
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'completedOn'}
                  direction={sortField === 'completedOn' ? sortOrder : 'asc'}
                  onClick={() => handleRequestSort('completedOn')}
                >
                  Completed On
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'waitingTime'}
                  direction={sortField === 'waitingTime' ? sortOrder : 'asc'}
                  onClick={() => handleRequestSort('waitingTime')}
                >
                  Waiting Time
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'servingTime'}
                  direction={sortField === 'servingTime' ? sortOrder : 'asc'}
                  onClick={() => handleRequestSort('servingTime')}
                >
                  Serving Time
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'totalTime'}
                  direction={sortField === 'totalTime' ? sortOrder : 'asc'}
                  onClick={() => handleRequestSort('totalTime')}
                >
                  Total Time
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'state'}
                  direction={sortField === 'state' ? sortOrder : 'asc'}
                  onClick={() => handleRequestSort('state')}
                >
                  State
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'teller'}
                  direction={sortField === 'teller' ? sortOrder : 'asc'}
                  onClick={() => handleRequestSort('teller')}
                >
                  Teller
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {queues.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((queue) => (
              <TableRow hover role="checkbox" tabIndex={-1} key={queue.id}>
                <TableCell>{queue.queueCode}</TableCell>
                <TableCell>{queue.serviceName}</TableCell>
                <TableCell>{queue.joinedOn}</TableCell>
                <TableCell>{queue.startServingTime}</TableCell>
                <TableCell>{queue.completedOn}</TableCell>
                <TableCell>{queue.waitingTime} min</TableCell>
                <TableCell>{queue.servingTime} min</TableCell>
                <TableCell>{queue.totalTime} min</TableCell>
                <TableCell>
                  <Chip label={queue.state} color={getStateColor(queue.state)} size="small" />
                </TableCell>
                <TableCell>{getTellerName(queue.teller)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={queues.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  )
}

export default Queues
