import React, { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  Snackbar,
  Alert
} from '@mui/material'
import { Add, Search } from '@mui/icons-material'
import { db, auth } from '../helpers/firebase' // Make sure this path is correct
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import AddServiceDialog from '../dialog/AddServiceDialog' // Import the new component

const Service = () => {
  const [services, setServices] = useState([])
  const [filteredServices, setFilteredServices] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    filterServices()
  }, [services, searchTerm, filterStatus])

  const fetchServices = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'services'))
      const servicesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        name: doc.data().service // Mapping 'service' field to 'name' for consistency
      }))
      setServices(servicesData)
    } catch (error) {
      console.error('Error fetching services: ', error)
      setSnackbar({
        open: true,
        message: 'Error fetching services. Please try again.',
        severity: 'error'
      })
    }
  }

  const filterServices = () => {
    let filtered = services

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((service) =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((service) => service.status === (filterStatus === 'enabled'))
    }

    setFilteredServices(filtered)
  }

  const handleAddService = (newService, message) => {
    if (newService) {
      setServices([...services, newService])
    }
    setSnackbar({
      open: true,
      message,
      severity: newService ? 'success' : 'error'
    })
  }

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setSnackbar({ ...snackbar, open: false })
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value)
  }

  const handleFilterChange = (event) => {
    setFilterStatus(event.target.value)
  }

  const handleToggleStatus = async (serviceId, currentStatus, serviceName) => {
    try {
      const serviceRef = doc(db, 'services', serviceId)
      const newStatus = !currentStatus
      await updateDoc(serviceRef, {
        status: newStatus
      })

      // Add log entry for status change
      const logsCollection = collection(db, 'logs')
      await addDoc(logsCollection, {
        timestamp: serverTimestamp(),
        level: 'ERROR',
        message: `Service "${serviceName}" status changed to ${newStatus ? 'enabled' : 'disabled'}`,
        email: auth.currentUser.email
      })

      setServices(
        services.map((service) =>
          service.id === serviceId ? { ...service, status: newStatus } : service
        )
      )

      setSnackbar({
        open: true,
        message: `Service status updated successfully!`,
        severity: 'success'
      })
    } catch (error) {
      console.error('Error updating service status: ', error)
      setSnackbar({
        open: true,
        message: 'Error updating service status. Please try again.',
        severity: 'error'
      })
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Find"
            InputProps={{
              startAdornment: <Search />
            }}
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <Select size="small" value={filterStatus} onChange={handleFilterChange}>
            <MenuItem value="all">Enabled, Disabled</MenuItem>
            <MenuItem value="enabled">Enabled</MenuItem>
            <MenuItem value="disabled">Disabled</MenuItem>
          </Select>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          New service
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">Name</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Edit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredServices.map((service) => (
              <TableRow key={service.id}>
                <TableCell align="center">{service.name}</TableCell>
                <TableCell align="center">
                  <Switch
                    checked={service.status}
                    onChange={() => handleToggleStatus(service.id, service.status, service.name)}
                  />
                </TableCell>
                <TableCell align="center">
                  <Button variant="outlined">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <AddServiceDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onAdd={handleAddService}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Service
