import React, { useState } from 'react'
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
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

const AddDeskDialog = ({ open, onClose, onAdd }) => {
  const [deskName, setDeskName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))

  const handleAdd = async () => {
    if (deskName.trim() !== '') {
      setIsLoading(true)
      try {
        const docRef = await addDoc(collection(db, 'desks'), {
          name: deskName,
          createdOn: serverTimestamp(),
          status: true
        })
        onAdd({ id: docRef.id, name: deskName, status: true }, 'Desk added successfully!')
        setDeskName('')
        onClose()
      } catch (error) {
        console.error('Error adding document: ', error)
        onAdd(null, 'Error adding desk. Please try again.')
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
      <DialogTitle>Add New Desk</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Desk Name"
          fullWidth
          value={deskName}
          onChange={(e) => setDeskName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleAdd} disabled={deskName.trim() === '' || isLoading}>
          {isLoading ? <CircularProgress size={24} /> : 'Add Desk'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddDeskDialog
