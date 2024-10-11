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
import { doc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore'

const EditDeskDialog = ({ open, onClose, onEdit, desk, existingDesks }) => {
  const [deskName, setDeskName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'))

  useEffect(() => {
    if (desk) {
      setDeskName(desk.name)
      setError('')
    }
  }, [desk])

  const handleEdit = async () => {
    if (deskName.trim() !== '' && deskName !== desk.name) {
      setIsLoading(true)
      setError('')

      // Check if the new name conflicts with existing desks
      const isNameConflict = existingDesks.some(
        (existingDesk) =>
          existingDesk.id !== desk.id &&
          existingDesk.name.toLowerCase() === deskName.trim().toLowerCase()
      )

      if (isNameConflict) {
        setError('A desk with this name already exists.')
        setIsLoading(false)
        return
      }

      try {
        const deskRef = doc(db, 'desks', desk.id)
        await updateDoc(deskRef, {
          name: deskName.trim()
        })
        onEdit({ ...desk, name: deskName.trim() }, 'Desk updated successfully!')
        onClose()
      } catch (error) {
        console.error('Error updating document: ', error)
        setError('Error updating desk. Please try again.')
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
      <DialogTitle>Edit Desk</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Desk Name"
          fullWidth
          value={deskName}
          onChange={(e) => {
            setDeskName(e.target.value)
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
          disabled={deskName.trim() === '' || deskName === desk?.name || isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : 'Update Desk'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditDeskDialog
