import React, { useState, useEffect, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts'
import {
  Typography,
  Box,
  CircularProgress,
  TextField,
  Chip,
  FormControlLabel,
  Switch,
  IconButton,
  Popover
} from '@mui/material'
import InfoRoundedIcon from '@mui/icons-material/InfoRounded'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../helpers/firebase'
import HourlyChartAnalysis from './HourlyChartAnalysis'

const HourlyVisit = () => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState([])
  const [selectedServices, setSelectedServices] = useState([])
  const [showAllServices, setShowAllServices] = useState(true)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesRef = collection(db, 'services')
        const servicesSnapshot = await getDocs(servicesRef)
        const servicesData = servicesSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().service
        }))
        setServices(servicesData)
        setSelectedServices(servicesData.map((service) => service.name))
      } catch (error) {
        console.error('Error fetching services:', error)
      }
    }

    fetchServices()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const queuesRef = collection(db, 'queues')
        const startOfDay = new Date(selectedDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(selectedDate)
        endOfDay.setHours(23, 59, 59, 999)

        const q = query(
          queuesRef,
          where('joinedOn', '>=', Timestamp.fromDate(startOfDay)),
          where('joinedOn', '<=', Timestamp.fromDate(endOfDay))
        )

        const querySnapshot = await getDocs(q)
        const queueData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id
        }))

        const hourlyData = processQueueData(queueData)
        setChartData(hourlyData)
      } catch (error) {
        console.error('Error fetching queue data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedDate, services, selectedServices, showAllServices])

  const processQueueData = (queueData) => {
    const hourlyVisits = {}
    const serviceSet = new Set(showAllServices ? services.map((s) => s.name) : selectedServices)

    queueData.forEach((queue) => {
      const hour = new Date(queue.joinedOn.toDate()).getHours()
      const hourKey = hour.toString().padStart(2, '0')
      const serviceId = queue.service
      const serviceName = services.find((s) => s.id === serviceId)?.name || 'Unknown Service'

      if (serviceSet.has(serviceName)) {
        if (!hourlyVisits[hourKey]) {
          hourlyVisits[hourKey] = {}
        }
        if (!hourlyVisits[hourKey][serviceName]) {
          hourlyVisits[hourKey][serviceName] = 0
        }
        hourlyVisits[hourKey][serviceName]++
      }
    })

    const allHours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))

    return allHours.map((hour) => {
      const hourData = { hour }
      serviceSet.forEach((serviceName) => {
        hourData[serviceName] = (hourlyVisits[hour] && hourlyVisits[hour][serviceName]) || 0
      })
      return hourData
    })
  }

  const handleDateChange = (event) => {
    setSelectedDate(new Date(event.target.value))
  }

  const handleServiceToggle = (serviceName) => {
    if (!showAllServices) {
      setSelectedServices((prev) =>
        prev.includes(serviceName) ? prev.filter((s) => s !== serviceName) : [...prev, serviceName]
      )
    }
  }

  const handleShowAllToggle = (event) => {
    setShowAllServices(event.target.checked)
  }

  const handleInfoClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleInfoClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)

  const activeServices = showAllServices ? services.map((s) => s.name) : selectedServices

  if (loading) {
    return (
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
    )
  }

  return (
    <Box sx={{ width: '100%', padding: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Hourly Visits
        </Typography>
        <IconButton aria-label="info" onClick={handleInfoClick} sx={{ mr: 2 }}>
          <InfoRoundedIcon />
        </IconButton>
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleInfoClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left'
          }}
        >
          <HourlyChartAnalysis
            chartData={chartData}
            activeServices={activeServices}
            selectedDate={selectedDate}
          />
        </Popover>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          mb: 2
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap'
          }}
        >
          <TextField
            label="Select Date"
            size="small"
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={handleDateChange}
            sx={{ width: 200 }}
            InputLabelProps={{ shrink: true }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={showAllServices}
                onChange={handleShowAllToggle}
                name="showAllServices"
              />
            }
            label="Show All Services"
          />
        </Box>
        <Box>
          <Typography variant="body1" gutterBottom>
            Services:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {services.map((service) => (
              <Chip
                key={service.id}
                label={service.name}
                onClick={() => handleServiceToggle(service.name)}
                color={
                  showAllServices || selectedServices.includes(service.name) ? 'primary' : 'default'
                }
                disabled={showAllServices}
              />
            ))}
          </Box>
        </Box>
      </Box>
      <Box sx={{ height: 500 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Legend />
            {activeServices.map((serviceName, index) => (
              <Bar
                key={serviceName}
                dataKey={serviceName}
                fill={`hsl(${(index * 360) / activeServices.length}, 70%, 50%)`}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}

export default HourlyVisit
