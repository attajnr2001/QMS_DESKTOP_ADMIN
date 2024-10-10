import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Select,
  MenuItem,
  Chip,
  Avatar,
  Box,
  InputLabel,
  FormControl,
  OutlinedInput,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material'
import { collection, getDocs, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, auth, storage } from '../helpers/firebase'

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

const AddTellerDialog = ({ open, onClose, onAdd }) => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [desk, setDesk] = useState('')
  const [services, setServices] = useState([])
  const [desks, setDesks] = useState([])
  const [allServices, setAllServices] = useState([])
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    fetchDesks()
    fetchServices()
  }, [])

  const fetchDesks = async () => {
    const querySnapshot = await getDocs(collection(db, 'desks'))
    setDesks(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
  }

  const fetchServices = async () => {
    const querySnapshot = await getDocs(collection(db, 'services'))
    setAllServices(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
  }

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0])
      setImagePreview(URL.createObjectURL(e.target.files[0]))
    }
  }

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
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, '123456')

      // Upload image to Firebase Storage
      let imageUrl = ''
      if (image) {
        const imageRef = ref(storage, `teller-images/${userCredential.user.uid}`)
        await uploadBytes(imageRef, image)
        imageUrl = await getDownloadURL(imageRef)
      }

      // Add teller to Firestore
      const tellerData = {
        name,
        email,
        desk,
        services: services.filter((service) => service !== undefined),
        status: true,
        createdOn: serverTimestamp(),
        image: imageUrl
      }
      console.log(tellerData)

      const docRef = await addDoc(collection(db, 'tellers'), tellerData)
      const tellerId = docRef.id

      await setDoc(doc(db, 'tempQueue', tellerId), {
        servingCount: 0
      })

      await addLogEntry(`New teller added: ${name} (ID: ${tellerId})`)

      onAdd({ id: docRef.id, ...tellerData })
      setSnackbar({
        open: true,
        message: 'Teller added successfully',
        severity: 'success'
      })
      onClose()
    } catch (error) {
      console.error('Error adding teller: ', error)
      setSnackbar({
        open: true,
        message: `Error adding teller: ${error.message}`,
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

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Add New Teller</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
            <Avatar
              src={imagePreview}
              sx={{ width: 150, height: 150, cursor: 'pointer' }}
              onClick={() => document.getElementById('image-upload').click()}
            />
            <input
              id="image-upload"
              type="file"
              hidden
              onChange={handleImageChange}
              accept="image/*"
            />
          </Box>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="desk-select-label">Desk</InputLabel>
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
            {loading ? <CircularProgress size={24} /> : 'Add Teller'}
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

export default AddTellerDialog
