import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  Chip,
  Box,
  InputLabel,
  FormControl,
  OutlinedInput,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material'
import { doc, updateDoc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../helpers/firebase'

const ITEM_HEIGHT = 48
const ITEM_PADDING_TOP = 8
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250
    }
  }
}

const EditTellerDialog = ({ open, onClose, teller, onEdit, desks, allServices }) => {
  const [desk, setDesk] = useState('')
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    if (teller) {
      setDesk(teller.desk)
      setServices(teller.services)
    }
  }, [teller])

  const handleServiceChange = (event) => {
    const {
      target: { value }
    } = event
    setServices(typeof value === 'string' ? value.split(',') : value)
  }

  const addLogEntry = async (message) => {
    try {
      const logsCollection = collection(db, 'logs')
      await addDoc(logsCollection, {
        timestamp: serverTimestamp(),
        level: 'ERROR',
        message: message,
        email: auth.currentUser.email
      })
    } catch (error) {
      console.error('Error adding log entry:', error)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const tellerRef = doc(db, 'tellers', teller.id)
      await updateDoc(tellerRef, {
        desk,
        services: services.filter((service) => service !== undefined)
      })

      const updatedTellerDoc = await getDoc(tellerRef)
      const updatedTeller = {
        id: updatedTellerDoc.id,
        ...updatedTellerDoc.data()
      }

      await addLogEntry(`Teller updated: ${teller.name}`)

      onEdit(updatedTeller)
      setSnackbar({
        open: true,
        message: 'Teller updated successfully',
        severity: 'success'
      })
      onClose()
    } catch (error) {
      console.error('Error updating teller: ', error)
      setSnackbar({
        open: true,
        message: `Error updating teller: ${error.message}`,
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setSnackbar({ ...snackbar, open: false })
  }

  if (!teller) return null

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Edit Teller: {teller.name}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel id="desk-select-label">Assigned To</InputLabel>
            <Select
              labelId="desk-select-label"
              value={desk}
              onChange={(e) => setDesk(e.target.value)}
            >
              {desks.map((desk) => (
                <MenuItem key={desk.id} value={desk.id}>
                  {desk.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel id="services-select-label">Services</InputLabel>
            <Select
              labelId="services-select-label"
              multiple
              value={services}
              onChange={handleServiceChange}
              input={<OutlinedInput label="Services" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip
                      key={value}
                      label={
                        allServices.find((service) => service.id === value)?.service ||
                        'Unknown Service'
                      }
                    />
                  ))}
                </Box>
              )}
              MenuProps={MenuProps}
            >
              {allServices.map((service) => (
                <MenuItem key={service.id} value={service.id}>
                  {service.service}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Update Teller'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default EditTellerDialog
