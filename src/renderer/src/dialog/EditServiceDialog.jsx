import React, { useState, useEffect } from 'react'
import {
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material'
import { db } from '../helpers/firebase' // Adjust this import path as needed
import { doc, updateDoc } from 'firebase/firestore'

const EditServiceDialog = ({ open, onClose, onEdit, service, existingServices }) => {
  const [serviceName, setServiceName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))

  useEffect(() => {
    if (service) {
      setServiceName(service.name)
      setError('')
    }
  }, [service])

  const handleEdit = async () => {
    if (serviceName.trim() !== '' && serviceName !== service.name) {
      setIsLoading(true)
      setError('')

      // Check if the new name conflicts with existing services
      const isNameConflict = existingServices.some(
        (existingService) =>
          existingService.id !== service.id &&
          existingService.name.toLowerCase() === serviceName.trim().toLowerCase()
      )

      if (isNameConflict) {
        setError('A service with this name already exists.')
        setIsLoading(false)
        return
      }

      try {
        const serviceRef = doc(db, 'services', service.id)
        await updateDoc(serviceRef, {
          service: serviceName.trim() // Use 'service' field as per your existing structure
        })
        onEdit({ ...service, name: serviceName.trim() }, 'Service updated successfully!')
        onClose()
      } catch (error) {
        console.error('Error updating document: ', error)
        setError('Error updating service. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          width: { xs: '90%', md: '50%' },
          maxWidth: 'none'
        }
      }}
    >
      <DialogTitle>Edit Service</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Service Name"
          fullWidth
          value={serviceName}
          onChange={(e) => {
            setServiceName(e.target.value)
            setError('')
          }}
          error={!!error}
          helperText={error}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleEdit}
          disabled={serviceName.trim() === '' || serviceName === service?.name || isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Update Service'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditServiceDialog
