import React, { useState } from 'react'
import {
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../helpers/firebase' // Make sure this path is correct

const AddServiceDialog = ({ open, onClose, onAdd }) => {
  const [serviceName, setServiceName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))

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

  const handleAdd = async () => {
    if (serviceName.trim() !== '') {
      setIsLoading(true)
      try {
        const docRef = await addDoc(collection(db, 'services'), {
          service: serviceName,
          createdOn: serverTimestamp(),
          status: true
        })
        await addLogEntry(`New service added: ${serviceName}`)
        onAdd({ id: docRef.id, name: serviceName, status: true }, 'Service added successfully!')
        setServiceName('')
        onClose()
      } catch (error) {
        console.error('Error adding document: ', error)
        onAdd(null, 'Error adding service. Please try again.')
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
      <DialogTitle>Add New Service</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Service Name"
          fullWidth
          value={serviceName}
          onChange={(e) => setServiceName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleAdd} disabled={serviceName.trim() === '' || isLoading}>
          {isLoading ? <CircularProgress size={24} /> : 'Add Service'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddServiceDialog
