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
import { db } from '../helpers/firebase' // Make sure this path is correct
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import AddDeskDialog from '../dialog/AddDeskDialog'
import EditDeskDialog from '../dialog/EditDeskDialog'

const Desks = () => {
  const [desks, setDesks] = useState([])
  const [filteredDesks, setFilteredDesks] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [selectedDesk, setSelectedDesk] = useState(null)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('enabled')

  useEffect(() => {
    fetchDesks()
  }, [])

  useEffect(() => {
    filterDesks()
  }, [desks, searchTerm, filterStatus])

  const fetchDesks = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'desks'))
      const desksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }))
      setDesks(desksData)
    } catch (error) {
      console.error('Error fetching desks: ', error)
      setSnackbar({
        open: true,
        message: 'Error fetching desks. Please try again.',
        severity: 'error'
      })
    }
  }

  const filterDesks = () => {
    let filtered = desks

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((desk) =>
        desk.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((desk) => desk.status === (filterStatus === 'enabled'))
    }

    setFilteredDesks(filtered)
  }

  const handleAddDesk = (newDesk, message) => {
    if (newDesk) {
      setDesks([...desks, newDesk])
    }
    setSnackbar({
      open: true,
      message,
      severity: newDesk ? 'success' : 'error'
    })
  }

  const handleEditDesk = (updatedDesk, message) => {
    if (updatedDesk) {
      setDesks(desks.map((desk) => (desk.id === updatedDesk.id ? updatedDesk : desk)))
    }
    setSnackbar({
      open: true,
      message,
      severity: updatedDesk ? 'success' : 'error'
    })
  }

  const handleOpenEditDialog = (desk) => {
    setSelectedDesk(desk)
    setOpenEditDialog(true)
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

  const handleToggleStatus = async (deskId, currentStatus) => {
    try {
      const deskRef = doc(db, 'desks', deskId)
      await updateDoc(deskRef, {
        status: !currentStatus
      })

      setDesks(
        desks.map((desk) => (desk.id === deskId ? { ...desk, status: !currentStatus } : desk))
      )

      setSnackbar({
        open: true,
        message: `Desk status updated successfully!`,
        severity: 'success'
      })
    } catch (error) {
      console.error('Error updating desk status: ', error)
      setSnackbar({
        open: true,
        message: 'Error updating desk status. Please try again.',
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
          New desk
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
            {filteredDesks.map((desk) => (
              <TableRow key={desk.id}>
                <TableCell align="center">{desk.name}</TableCell>
                <TableCell align="center">
                  <Switch
                    checked={desk.status}
                    onChange={() => handleToggleStatus(desk.id, desk.status)}
                  />
                </TableCell>
                <TableCell align="center">
                  <Button variant="outlined" onClick={() => handleOpenEditDialog(desk)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <AddDeskDialog open={openDialog} onClose={() => setOpenDialog(false)} onAdd={handleAddDesk} />
      <EditDeskDialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        onEdit={handleEditDesk}
        desk={selectedDesk}
        existingDesks={desks}
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

export default Desks
