import React from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { Tabs, Tab, Box } from '@mui/material'

const Overview = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const getTabValue = () => {
    const path = location.pathname.split('/').pop()
    switch (path) {
      case 'today':
        return 0
      case 'dailyReport':
        return 1
      case 'weeklyReport':
        return 2
      case 'monthlyReport':
        return 3
      case 'allTime':
        return 4
      case 'dataAnalysis':
        return 5
      default:
        return 0
    }
  }

  const handleChange = (event, newValue) => {
    switch (newValue) {
      case 0:
        navigate('/admin/overview/today')
        break
      case 1:
        navigate('/admin/overview/dailyReport')
        break
      case 2:
        navigate('/admin/overview/weeklyReport')
        break
      case 3:
        navigate('/admin/overview/monthlyReport')
        break
      case 4:
        navigate('/admin/overview/allTime')
        break
      case 5:
        navigate('/admin/overview/dataAnalysis')
        break
      default:
        break
    }
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={getTabValue()}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Today" />
          <Tab label="Daily Report" />
          <Tab label="Weekly Report" />
          <Tab label="Monthly Report" />
          <Tab label="All Time" />
          <Tab label="Data Analysis" />
        </Tabs>
      </Box>
      <Box sx={{ padding: 3 }}>
        <Outlet />
      </Box>
    </Box>
  )
}

export default Overview
