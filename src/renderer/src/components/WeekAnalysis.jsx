import React, { useState, useEffect } from 'react'
import { Box, Typography, Grid, CircularProgress, TextField } from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../helpers/firebase'

const MetricCard = ({ value, label, change, unit = '' }) => {
  const isPositiveChange = change >= 0
  return (
    <Box>
      <Typography variant="h4" component="div" fontWeight="bold" color="primary">
        {value}
        {unit}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Box display="flex" alignItems="center" mt={1}>
        {isPositiveChange ? (
          <TrendingUpIcon color="success" fontSize="small" />
        ) : (
          <TrendingDownIcon color="error" fontSize="small" />
        )}
        <Typography
          variant="body2"
          color={isPositiveChange ? 'success.main' : 'error.main'}
          ml={0.5}
        >
          {Math.abs(change.toFixed(2))}% prev. week
        </Typography>
      </Box>
    </Box>
  )
}

const WeekAnalysis = () => {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date()
    const yearStart = new Date(now.getFullYear(), 0, 1)
    const days = Math.floor((now - yearStart) / (24 * 60 * 60 * 1000))
    const weekNumber = Math.ceil((days + yearStart.getDay() + 1) / 7)
    return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`
  })

  const [metrics, setMetrics] = useState({
    customers: { value: 0, change: 0 },
    avgWaitTime: { value: 0, change: 0 },
    avgServiceTime: { value: 0, change: 0 }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const queuesRef = collection(db, 'queues')

        // Parse the selected week string to get the start of the week
        const [year, week] = selectedWeek.split('-W')
        const weekStart = new Date(year, 0, 1 + (week - 1) * 7)
        weekStart.setDate(
          weekStart.getDate() + (weekStart.getDay() === 0 ? -6 : 1) - weekStart.getDay()
        )

        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 7)
        weekEnd.setSeconds(weekEnd.getSeconds() - 1)

        const lastWeekStart = new Date(weekStart)
        lastWeekStart.setDate(lastWeekStart.getDate() - 7)
        const lastWeekEnd = new Date(weekEnd)
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 7)

        const weekQuery = query(
          queuesRef,
          where('joinedOn', '>=', Timestamp.fromDate(weekStart)),
          where('joinedOn', '<=', Timestamp.fromDate(weekEnd))
        )

        const lastWeekQuery = query(
          queuesRef,
          where('joinedOn', '>=', Timestamp.fromDate(lastWeekStart)),
          where('joinedOn', '<=', Timestamp.fromDate(lastWeekEnd))
        )

        const [weekSnapshot, lastWeekSnapshot] = await Promise.all([
          getDocs(weekQuery),
          getDocs(lastWeekQuery)
        ])

        const weekData = weekSnapshot.docs.map((doc) => doc.data())
        const lastWeekData = lastWeekSnapshot.docs.map((doc) => doc.data())

        const calculateMetrics = (data) => ({
          customers: data.length,
          avgWaitTime: data.reduce((sum, queue) => sum + queue.waitingTime, 0) / data.length || 0,
          avgServiceTime: data.reduce((sum, queue) => sum + queue.servingTime, 0) / data.length || 0
        })

        const weekMetrics = calculateMetrics(weekData)
        const lastWeekMetrics = calculateMetrics(lastWeekData)

        const calculateChange = (current, previous) =>
          previous === 0 ? 100 : ((current - previous) / previous) * 100

        setMetrics({
          customers: {
            value: weekMetrics.customers,
            change: calculateChange(weekMetrics.customers, lastWeekMetrics.customers)
          },
          avgWaitTime: {
            value: Math.round(weekMetrics.avgWaitTime),
            change: calculateChange(weekMetrics.avgWaitTime, lastWeekMetrics.avgWaitTime)
          },
          avgServiceTime: {
            value: Math.round(weekMetrics.avgServiceTime),
            change: calculateChange(weekMetrics.avgServiceTime, lastWeekMetrics.avgServiceTime)
          }
        })
      } catch (error) {
        console.error('Error fetching queue data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedWeek])

  const handleWeekChange = (event) => {
    setSelectedWeek(event.target.value)
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 200
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant="h5" gutterBottom fontWeight={'bold'}>
          Week Analysis
        </Typography>
        <TextField
          label="Select Week"
          size="small"
          type="week"
          value={selectedWeek}
          onChange={handleWeekChange}
          sx={{
            width: 200
          }}
          InputLabelProps={{
            shrink: true
          }}
        />
      </Box>
      <Grid container spacing={4}>
        <Grid item xs={12} sm={4}>
          <MetricCard
            value={metrics.customers.value}
            label="Customers"
            change={metrics.customers.change}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            value={metrics.avgWaitTime.value}
            label="Avg wait time"
            change={metrics.avgWaitTime.change}
            unit=" min"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            value={metrics.avgServiceTime.value}
            label="Avg service time"
            change={metrics.avgServiceTime.change}
            unit=" min"
          />
        </Grid>
      </Grid>
    </Box>
  )
}

export default WeekAnalysis
