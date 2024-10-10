import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
  Paper
} from '@mui/material'
import {
  Dashboard,
  Settings as SettingsIcon,
  AccessTime,
  RoomService,
  ImportantDevicesRounded,
  Person,
  Assessment,
  ExitToApp,
  StackedLineChartRounded
} from '@mui/icons-material'
import { db, auth } from '../helpers/firebase' // Make sure this path is correct
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

const sidebarItems = [
  { name: 'General', path: '', icon: <SettingsIcon /> },
  { name: 'Opening hours', path: 'opening-hours', icon: <AccessTime /> },
  { name: 'Services', path: 'services', icon: <RoomService /> },
  { name: 'Desks', path: 'desks', icon: <ImportantDevicesRounded /> },
  { name: 'Tellers', path: 'tellers', icon: <Person /> },
  { name: 'Queues', path: 'queues', icon: <StackedLineChartRounded /> },
  { name: 'Logs', path: 'logs', icon: <Assessment /> },
  { name: 'Logout', path: '/', icon: <ExitToApp /> }
]

const Settings = () => {
  const [selectedItem, setSelectedItem] = useState('general')
  const navigate = useNavigate()

  const addLogEntry = async (message) => {
    try {
      const logsCollection = collection(db, 'logs')
      await addDoc(logsCollection, {
        timestamp: serverTimestamp(),
        level: 'INFO',
        message: message,
        email: auth.currentUser?.email || 'Unknown user'
      })
    } catch (error) {
      console.error('Error adding log entry:', error)
    }
  }

  const handleItemClick = async (path) => {
    setSelectedItem(path)
    if (path === '/') {
      // This is the logout path
      await addLogEntry('User logged out')
      // Here you would typically call your logout function
      // For example: await logout();
    }
    navigate(path)
  }

  return (
    <Box sx={{ display: 'flex', height: '80vh' }}>
      <Paper elevation={0} sx={{ width: 250, overflowY: 'auto', backgroundColor: '#fafafa83' }}>
        <List>
          {sidebarItems.map((item) => (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={selectedItem === item.path}
                onClick={() => handleItemClick(item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(0, 0, 0, 0.08)'
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.12)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 30 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.name}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: selectedItem === item.path ? 'bold' : 'normal'
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Main content area */}
      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Outlet />
      </Box>
    </Box>
  )
}

export default Settings
