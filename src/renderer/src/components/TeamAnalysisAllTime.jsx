import React, { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Typography,
  Box,
  CircularProgress,
  TextField
} from '@mui/material'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../helpers/firebase'
import TeamAnalysisChart from './TeamAnalysisChart'

const TeamAnalysisAllTime = () => {
  const [orderBy, setOrderBy] = useState('name')
  const [order, setOrder] = useState('asc')
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0] // Format as YYYY-MM-DD
  })
  const [teamAnalysis, setTeamAnalysis] = useState([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('2024-01-01')

  useEffect(() => {
    const fetchTeamAnalysis = async () => {
      try {
        setLoading(true)

        // Parse the start and end dates
        const startDateObj = new Date(startDate)
        const endDateObj = new Date(endDate)

        // Set the start of the start date
        startDateObj.setHours(0, 0, 0, 0)

        // Set the end of the end date
        endDateObj.setHours(23, 59, 59, 999)

        // Fetch all tellers
        const tellersRef = collection(db, 'tellers')
        const tellersSnapshot = await getDocs(tellersRef)
        const tellers = tellersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))

        // Fetch queues for the selected date range
        const queuesRef = collection(db, 'queues')
        const queuesQuery = query(
          queuesRef,
          where('joinedOn', '>=', Timestamp.fromDate(startDateObj)),
          where('joinedOn', '<=', Timestamp.fromDate(endDateObj))
        )
        const queuesSnapshot = await getDocs(queuesQuery)
        const queues = queuesSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id
        }))

        // Process data
        const tellerAnalysis = tellers.map((teller) => {
          const tellerQueues = queues.filter(
            (queue) => queue.teller === teller.id && queue.state === 'completed'
          )
          const visitorsServed = tellerQueues.length
          const totalServiceTime = tellerQueues.reduce(
            (total, queue) => total + (queue.servingTime || 0),
            0
          )
          const totalWaitingTime = tellerQueues.reduce(
            (total, queue) => total + (queue.waitingTime || 0),
            0
          )
          const avgServiceTime = visitorsServed > 0 ? totalServiceTime / visitorsServed : 0
          const avgWaitingTime = visitorsServed > 0 ? totalWaitingTime / visitorsServed : 0

          return {
            name: teller.name,
            visitorsServed,
            avgServiceTime: formatTime(avgServiceTime),
            totalServiceTime: formatTime(totalServiceTime),
            avgWaitingTime: formatTime(avgWaitingTime),
            totalWaitingTime: formatTime(totalWaitingTime)
          }
        })

        setTeamAnalysis(tellerAnalysis)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching team analysis:', error)
        setLoading(false)
      }
    }

    fetchTeamAnalysis()
  }, [startDate, endDate])

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.floor(minutes % 60)
    const secs = Math.floor((minutes * 60) % 60)
    return `${hours.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const sortedData = React.useMemo(() => {
    const comparator = (a, b) => {
      if (b[orderBy] < a[orderBy]) {
        return -1
      }
      if (b[orderBy] > a[orderBy]) {
        return 1
      }
      return 0
    }

    return [...teamAnalysis].sort((a, b) => {
      return order === 'desc' ? comparator(a, b) : -comparator(a, b)
    })
  }, [order, orderBy, teamAnalysis])

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}
      >
        <Typography variant="h5" gutterBottom fontWeight={'bold'}>
          Team Analysis All Time
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            type="date"
            size="small"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputProps={{
              inputProps: { max: new Date().toISOString().split('T')[0] }
            }}
            label="Select Start Date"
            variant="outlined"
          />
          <TextField
            type="date"
            size="small"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputProps={{
              inputProps: { max: new Date().toISOString().split('T')[0] }
            }}
            label="Select End Date"
            variant="outlined"
          />
        </Box>
      </Box>
      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 400
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="team analysis table">
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'name'}
                    direction={orderBy === 'name' ? order : 'asc'}
                    onClick={() => handleRequestSort('name')}
                  >
                    Team member
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'visitorsServed'}
                    direction={orderBy === 'visitorsServed' ? order : 'asc'}
                    onClick={() => handleRequestSort('visitorsServed')}
                  >
                    Visitors served
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'avgServiceTime'}
                    direction={orderBy === 'avgServiceTime' ? order : 'asc'}
                    onClick={() => handleRequestSort('avgServiceTime')}
                  >
                    Avg service time
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'totalServiceTime'}
                    direction={orderBy === 'totalServiceTime' ? order : 'asc'}
                    onClick={() => handleRequestSort('totalServiceTime')}
                  >
                    Total service time
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'avgWaitingTime'}
                    direction={orderBy === 'avgWaitingTime' ? order : 'asc'}
                    onClick={() => handleRequestSort('avgWaitingTime')}
                  >
                    Avg waiting time
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === 'totalWaitingTime'}
                    direction={orderBy === 'totalWaitingTime' ? order : 'asc'}
                    onClick={() => handleRequestSort('totalWaitingTime')}
                  >
                    Total waiting time
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((row) => (
                <TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    {row.name}
                  </TableCell>
                  <TableCell align="right">{row.visitorsServed}</TableCell>
                  <TableCell align="right">{row.avgServiceTime}</TableCell>
                  <TableCell align="right">{row.totalServiceTime}</TableCell>
                  <TableCell align="right">{row.avgWaitingTime}</TableCell>
                  <TableCell align="right">{row.totalWaitingTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ my: 3 }}>
        <TeamAnalysisChart teamAnalysis={sortedData} />
      </Box>
    </Box>
  )
}

export default TeamAnalysisAllTime
