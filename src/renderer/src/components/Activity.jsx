import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material'
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../helpers/firebase'
import { SentimentSatisfiedAlt, SentimentVeryDissatisfied } from '@mui/icons-material'

const Activity = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [stats, setStats] = useState({ positive: 0, negative: 0, total: 0 })

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const q = query(collection(db, 'reviews'), orderBy('time', 'desc'), limit(50))
        const querySnapshot = await getDocs(q)
        const fetchedActivities = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          time: doc.data().time?.toDate()
        }))
        setActivities(fetchedActivities)
        calculateStats(fetchedActivities)
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [])

  const calculateStats = (activities) => {
    const total = activities.length
    const positive = activities.filter((a) => a.type === 'positive').length
    const negative = total - positive
    setStats({ positive, negative, total })
  }

  const formatDate = (date) => {
    if (!date) return ''
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  const formatTime = (date) => {
    if (!date) return ''
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const handleFilterChange = (event) => {
    setFilter(event.target.value)
  }

  const filteredActivities = activities.filter((activity) => {
    if (filter === 'all') return true
    return activity.type === filter
  })

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
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel id="filter-label">Filter</InputLabel>
          <Select
            labelId="filter-label"
            size="small"
            id="filter-select"
            value={filter}
            label="Filter"
            onChange={handleFilterChange}
            sx={{ minWidth: '250px' }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="positive">Positive</MenuItem>
            <MenuItem value="negative">Negative</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={(stats.positive / stats.total) * 100}
              color="success"
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="caption" component="div" color="text.secondary">
                {`${Math.round((stats.positive / stats.total) * 100)}%`}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress
              variant="determinate"
              value={(stats.negative / stats.total) * 100}
              color="error"
            />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography variant="caption" component="div" color="text.secondary">
                {`${Math.round((stats.negative / stats.total) * 100)}%`}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      {filteredActivities.map((activity) => (
        <Paper
          key={activity.id}
          elevation={1}
          sx={{
            p: 2,
            mb: 1,
            backgroundColor: '#5f5f5f0c'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {formatDate(activity.time)} at {formatTime(activity.time)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {activity.type === 'positive' ? (
              <SentimentSatisfiedAlt color="success" sx={{ mr: 1 }} />
            ) : (
              <SentimentVeryDissatisfied color="error" sx={{ mr: 1 }} />
            )}
            <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'bold' }}>
              {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
            </Typography>
          </Box>
          <Typography variant="body2">{activity.message}</Typography>
        </Paper>
      ))}
    </Box>
  )
}

export default Activity
