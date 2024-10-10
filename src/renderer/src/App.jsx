import React from 'react'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate
} from 'react-router-dom'
import Welcome from './pages/Welcome'
import Login from './pages/Login'
import Today from './pages/Today'
import DailyReport from './pages/DailyReport'
import WeeklyReport from './pages/WeeklyReport'
import MonthlyReport from './pages/MonthlyReport'
import AllTimeReport from './pages/AllTimeReport'
import DataInsights from './pages/DataInsights'
import Settings from './pages/Settings'
import Overview from './pages/Overview'
import Services from './pages/Services'
import DataAnalysis from './pages/DataAnalysis'
import RootLayout from './layouts/RootLayout'
import General from './components/General'
import OpeningHours from './components/OpeningHours'
import Desks from './components/Desks'
import Service from './components/Service'
import Tellers from './components/Tellers'
import Admins from './components/Admins'
import Logs from './components/Logs'
import Queues from './components/Queues'
import ProtectedRoute from './components/ProtectedRoute'

import theme from './helpers/Theme'
import { ThemeProvider } from '@mui/material/styles'

const App = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="" element={<Welcome />} />
        <Route path="login" element={<Login />} />
        <Route path="admin" element={<ProtectedRoute />}>
          <Route element={<RootLayout />}>
            <Route path="overview" element={<Overview />}>
              <Route index element={<Navigate to="today" replace />} />
              <Route path="today" element={<Today />} />
              <Route path="dailyReport" element={<DailyReport />} />
              <Route path="weeklyReport" element={<WeeklyReport />} />
              <Route path="monthlyReport" element={<MonthlyReport />} />
              <Route path="allTime" element={<AllTimeReport />} />
              <Route path="dataAnalysis" element={<DataAnalysis />} />
            </Route>
            <Route path="services" element={<Services />} />
            <Route path="dataInsights" element={<DataInsights />} />
            <Route path="settings" element={<Settings />}>
              <Route path="" element={<General />} />
              <Route path="opening-hours" element={<OpeningHours />} />
              <Route path="desks" element={<Desks />} />
              <Route path="services" element={<Service />} />
              <Route path="tellers" element={<Tellers />} />
              <Route path="admins" element={<Admins />} />
              <Route path="logs" element={<Logs />} />
              <Route path="queues" element={<Queues/>} />
            </Route>
          </Route>
        </Route>
      </>
    )
  )

  return (
    <ThemeProvider theme={theme}>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}

export default App
