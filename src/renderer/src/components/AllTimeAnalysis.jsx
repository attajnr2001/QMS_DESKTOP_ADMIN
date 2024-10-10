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
          {Math.abs(change.toFixed(2))}% prev. period
        </Typography>
      </Box>
    </Box>
  )
}

const AllTimeAnalysis = () => {
  const [dateRange, setDateRange] = useState({
    start: '2024-01-01',
    end: new Date().toISOString().split('T')[0]
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
        const startDate = new Date(dateRange.start)
        const endDate = new Date(dateRange.end)
        endDate.setHours(23, 59, 59, 999)

        const previousStartDate = new Date(startDate)
        previousStartDate.setDate(
          previousStartDate.getDate() -
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        )

        const currentQuery = query(
          queuesRef,
          where('joinedOn', '>=', Timestamp.fromDate(startDate)),
          where('joinedOn', '<=', Timestamp.fromDate(endDate))
        )

        const previousQuery = query(
          queuesRef,
          where('joinedOn', '>=', Timestamp.fromDate(previousStartDate)),
          where('joinedOn', '<', Timestamp.fromDate(startDate))
        )

        const [currentSnapshot, previousSnapshot] = await Promise.all([
          getDocs(currentQuery),
          getDocs(previousQuery)
        ])

        const currentData = currentSnapshot.docs.map((doc) => doc.data())
        const previousData = previousSnapshot.docs.map((doc) => doc.data())

        const calculateMetrics = (data) => ({
          customers: data.length,
          avgWaitTime: data.reduce((sum, queue) => sum + queue.waitingTime, 0) / data.length || 0,
          avgServiceTime: data.reduce((sum, queue) => sum + queue.servingTime, 0) / data.length || 0
        })

        const currentMetrics = calculateMetrics(currentData)
        const previousMetrics = calculateMetrics(previousData)

        const calculateChange = (current, previous) =>
          previous === 0 ? 100 : ((current - previous) / previous) * 100

        setMetrics({
          customers: {
            value: currentMetrics.customers,
            change: calculateChange(currentMetrics.customers, previousMetrics.customers)
          },
          avgWaitTime: {
            value: Math.round(currentMetrics.avgWaitTime),
            change: calculateChange(currentMetrics.avgWaitTime, previousMetrics.avgWaitTime)
          },
          avgServiceTime: {
            value: Math.round(currentMetrics.avgServiceTime),
            change: calculateChange(currentMetrics.avgServiceTime, previousMetrics.avgServiceTime)
          }
        })
      } catch (error) {
        console.error('Error fetching queue data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange])

  const handleDateChange = (e) => {
    const { name, value } = e.target
    setDateRange((prev) => ({ ...prev, [name]: value }))
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
          All Time Analysis
        </Typography>
        <Box>
          <TextField
            label="Select Start Date"
            size="small"
            type="date"
            name="start"
            value={dateRange.start}
            onChange={handleDateChange}
            sx={{
              width: 200,
              mr: 1
            }}
            inputProps={{
              max: dateRange.end // setting the max property here
            }}
          />

          <TextField
            label="Select End Date"
            size="small"
            type="date"
            name="end"
            value={dateRange.end}
            onChange={handleDateChange}
            sx={{
              width: 200
            }}
            inputProps={{
              max: new Date().toISOString().split('T')[0],
              min: dateRange.start
            }}
          />
        </Box>
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

export default AllTimeAnalysis
