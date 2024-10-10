import React, { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
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
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Popover,
  Paper,
  Button
} from '@mui/material'
import InfoRoundedIcon from '@mui/icons-material/InfoRounded'
import RefreshIcon from '@mui/icons-material/Refresh'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../helpers/firebase'
import ChartAnalysis from './ChartAnalysis'

const WeeklyComparisonPage = () => {
  const [anchorEl, setAnchorEl] = useState(null)
  const [dateRange, setDateRange] = useState({
    start: '2024-01-01',
    end: new Date().toISOString().split('T')[0]
  })
  const [weeklyData, setWeeklyData] = useState([])
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState([])
  const [selectedServices, setSelectedServices] = useState([])
  const [showAllServices, setShowAllServices] = useState(false)
  const [selectedDays, setSelectedDays] = useState([])
  const [chartType, setChartType] = useState('bar')
  const [shouldFetch, setShouldFetch] = useState(false)

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

  const handleChartTypeChange = (event, newChartType) => {
    if (newChartType !== null) {
      setChartType(newChartType)
    }
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

        // Select only the first service by default
        if (servicesData.length > 0) {
          setSelectedServices([servicesData[0].name])
        }

        // Select all days by default
        setSelectedDays([...daysOfWeek])
      } catch (error) {
        console.error('Error fetching services:', error)
      }
    }

    fetchServices()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!shouldFetch) return

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

        const processedData = processWeeklyData(queueData)
        setWeeklyData(processedData)
      } catch (error) {
        console.error('Error fetching queue data:', error)
      } finally {
        setLoading(false)
        setShouldFetch(false)
      }
    }

    fetchData()
  }, [dateRange, services, selectedServices, showAllServices, shouldFetch])

  const processWeeklyData = (queueData) => {
    const weeklyVisits = daysOfWeek.reduce((acc, day) => {
      acc[day] = {}
      return acc
    }, {})

    const serviceSet = new Set(showAllServices ? services.map((s) => s.name) : selectedServices)

    queueData.forEach((queue) => {
      const date = queue.joinedOn.toDate()
      const dayIndex = date.getDay()
      if (dayIndex >= 1 && dayIndex <= 5) {
        const dayOfWeek = daysOfWeek[dayIndex - 1]
        const serviceId = queue.service
        const serviceName = services.find((s) => s.id === serviceId)?.name || 'Unknown Service'

        if (serviceSet.has(serviceName)) {
          if (!weeklyVisits[dayOfWeek][serviceName]) {
            weeklyVisits[dayOfWeek][serviceName] = 0
          }
          weeklyVisits[dayOfWeek][serviceName]++
        }
      }
    })

    return daysOfWeek.map((day) => ({
      day,
      ...weeklyVisits[day]
    }))
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

  const handleDayToggle = (day) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const handleRefresh = () => {
    setShouldFetch(true)
  }

  const filteredData = weeklyData.filter((data) => selectedDays.includes(data.day))

  const handleInfoClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleInfoClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)

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

  const renderChart = () => {
    const ChartComponent = chartType === 'bar' ? BarChart : LineChart
    const DataComponent = chartType === 'bar' ? Bar : Line

    return (
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Legend />
          {activeServices.map((serviceName, index) => (
            <DataComponent
              key={serviceName}
              type="monotone"
              dataKey={serviceName}
              stroke={colors[index % colors.length]}
              fill={chartType === 'bar' ? colors[index % colors.length] : undefined}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    )
  }

  return (
    <Box sx={{ width: '100%', padding: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mr: '1rem'
        }}
      >
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Weekdays Chart
        </Typography>

        <Box>
          <IconButton aria-label="info" onClick={handleInfoClick} sx={{ mr: 1 }}>
            <InfoRoundedIcon />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh Data
          </Button>
        </Box>

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
          <Paper sx={{ maxWidth: 800 }}>
            <ChartAnalysis
              weeklyData={filteredData}
              selectedServices={activeServices}
              selectedDays={selectedDays}
            />
          </Paper>
        </Popover>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap'
          }}
        >
          <TextField
            label="Start Date"
            type="date"
            size="small"
            name="start"
            value={dateRange.start}
            onChange={handleDateChange}
            sx={{ width: 200 }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            type="date"
            size="small"
            name="end"
            value={dateRange.end}
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
        <Box>
          <Typography variant="body1" gutterBottom>
            Select days to compare:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {daysOfWeek.map((day) => (
              <Chip
                key={day}
                label={day}
                onClick={() => handleDayToggle(day)}
                color={selectedDays.includes(day) ? 'primary' : 'default'}
              />
            ))}
          </Box>
        </Box>
      </Box>
      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={chartType}
          exclusive
          onChange={handleChartTypeChange}
          aria-label="chart type"
        >
          <ToggleButton value="bar" aria-label="bar chart">
            Bar Chart
          </ToggleButton>
          <ToggleButton value="line" aria-label="line chart">
            Line Chart
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      <Box sx={{ height: 500 }}>{renderChart()}</Box>
    </Box>
  )
}

export default WeeklyComparisonPage
