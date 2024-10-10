import React, { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
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
  Switch
} from '@mui/material'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../helpers/firebase'

const AllTimeVisit = () => {
  const [dateRange, setDateRange] = useState({
    start: '2024-01-01',
    end: new Date().toISOString().split('T')[0]
  })
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState([])
  const [selectedServices, setSelectedServices] = useState([])
  const [showAllServices, setShowAllServices] = useState(true)

  const CustomXAxisTick = (props) => {
    const { x, y, payload } = props
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fill="#666"
          fontSize={10}
          transform="rotate(-45)"
        >
          {payload.value}
        </text>
      </g>
    )
  }

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
        const startDate = new Date(dateRange.start)
        const endDate = new Date(dateRange.end)
        endDate.setHours(23, 59, 59, 999)

        const q = query(
          queuesRef,
          where('joinedOn', '>=', Timestamp.fromDate(startDate)),
          where('joinedOn', '<=', Timestamp.fromDate(endDate))
        )

        const querySnapshot = await getDocs(q)
        const queueData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id
        }))

        const processedData = processQueueData(queueData)
        setChartData(processedData)
      } catch (error) {
        console.error('Error fetching queue data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange, services, selectedServices, showAllServices])

  const processQueueData = (queueData) => {
    const dailyVisits = {}
    const serviceSet = new Set(showAllServices ? services.map((s) => s.name) : selectedServices)

    queueData.forEach((queue) => {
      const date = queue.joinedOn.toDate()
      const dayKey = date.toISOString().split('T')[0]
      const serviceId = queue.service
      const serviceName = services.find((s) => s.id === serviceId)?.name || 'Unknown Service'

      if (serviceSet.has(serviceName)) {
        if (!dailyVisits[dayKey]) {
          dailyVisits[dayKey] = {}
        }
        if (!dailyVisits[dayKey][serviceName]) {
          dailyVisits[dayKey][serviceName] = 0
        }
        dailyVisits[dayKey][serviceName]++
      }
    })

    const start = new Date(dateRange.start)
    const end = new Date(dateRange.end)
    const allDays = []
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      // Exclude Saturday (6) and Sunday (0)
      if (d.getDay() !== 0 && d.getDay() !== 6) {
        allDays.push(d.toISOString().split('T')[0])
      }
    }

    return allDays.map((day) => {
      const dayData = { day }
      serviceSet.forEach((serviceName) => {
        dayData[serviceName] = (dailyVisits[day] && dailyVisits[day][serviceName]) || 0
      })
      return dayData
    })
  }

  const handleDateChange = (e) => {
    const { name, value } = e.target
    setDateRange((prev) => ({ ...prev, [name]: value }))
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

  const colors = [
    '#8884d8',
    '#82ca9d',
    '#ffc658',
    '#ff7300',
    '#a4de6c',
    '#d0ed57',
    '#ffc0cb',
    '#40e0d0',
    '#ff6347',
    '#ba55d3'
  ]

  const activeServices = showAllServices ? services.map((s) => s.name) : selectedServices

  return (
    <Box sx={{ width: '100%', height: 550 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          mb: 2
        }}
      >
        <Typography variant="h5" gutterBottom fontWeight={'bold'}>
          All Time Visits
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap'
          }}
        >
          <TextField
            label="Select Start Date"
            size="small"
            type="date"
            name="start"
            value={dateRange.start}
            onChange={handleDateChange}
            sx={{ width: 200 }}
            inputProps={{
              max: dateRange.end
            }}
          />
          <TextField
            label="Select End Date"
            size="small"
            type="date"
            name="end"
            value={dateRange.end}
            onChange={handleDateChange}
            sx={{ width: 200 }}
            inputProps={{
              max: new Date().toISOString().split('T')[0],
              min: dateRange.start
            }}
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
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap'
          }}
        >
          <Typography variant="body1">Services:</Typography>
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
      <ResponsiveContainer width="100%" height="75%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 65
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tick={<CustomXAxisTick />}
            interval={Math.ceil(chartData.length / 30)}
          />
          <YAxis />
          <Tooltip />
          <Legend />
          {activeServices.map((serviceName, index) => (
            <Line
              key={serviceName}
              type="monotone"
              dataKey={serviceName}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  )
}

export default AllTimeVisit
