import React, { useState, useEffect } from 'react'
import {
  Typography,
  Box,
  Grid,
  Switch,
  Divider,
  IconButton,
  Snackbar,
  Alert,
  TextField,
  Button
} from '@mui/material'
import { DownloadDoneRounded } from '@mui/icons-material'
import { db, auth } from '../helpers/firebase'
import { collection, getDocs, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore'
import { AuthContext } from '../context/AuthContext'

const orderedDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const OpeningHours = () => {
  const [hours, setHours] = useState([])
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  })
  const [universalStart, setUniversalStart] = useState('08:00')
  const [universalEnd, setUniversalEnd] = useState('16:00')
  const [useUniversal, setUseUniversal] = useState(false)

  useEffect(() => {
    fetchDays()
  }, [])

  const fetchDays = async () => {
    const daysCollection = collection(db, 'days')
    const daysSnapshot = await getDocs(daysCollection)
    const daysData = daysSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      startTime: doc.data().startTime || '08:00',
      endTime: doc.data().endTime || '16:00'
    }))

    const sortedDays = orderedDays.map(
      (day) =>
        daysData.find((d) => d.name === day) || {
          name: day,
          status: false,
          startTime: '08:00',
          endTime: '16:00'
        }
    )

    setHours(sortedDays)
  }

  const addLogEntry = async (message) => {
    try {
      const logsCollection = collection(db, 'logs')
      await addDoc(logsCollection, {
        timestamp: serverTimestamp(),
        level: 'INFO',
        message: message,
        email: auth.currentUser.email
      })
    } catch (error) {
      console.error('Error adding log entry:', error)
    }
  }

  const handleToggle = (index) => {
    const newHours = [...hours]
    newHours[index].status = !newHours[index].status
    setHours(newHours)
  }

  const handleTimeChange = (index, field, value) => {
    const newHours = [...hours]
    newHours[index][field] = value
    setHours(newHours)
  }

  const handleUniversalTimeChange = (field, value) => {
    if (field === 'start') {
      setUniversalStart(value)
    } else {
      setUniversalEnd(value)
    }
  }

  const handleUniversalToggle = async () => {
    const newUseUniversal = !useUniversal
    setUseUniversal(newUseUniversal)

    if (newUseUniversal) {
      try {
        const updatedHours = hours.map((day) => ({
          ...day,
          startTime: universalStart,
          endTime: universalEnd
        }))

        // Update Firestore
        for (const day of updatedHours) {
          if (day.id) {
            const dayDoc = doc(db, 'days', day.id)
            await updateDoc(dayDoc, {
              status: day.status,
              startTime: day.startTime,
              endTime: day.endTime
            })
          } else {
            const daysCollection = collection(db, 'days')
            await addDoc(daysCollection, {
              name: day.name,
              status: day.status,
              startTime: day.startTime,
              endTime: day.endTime
            })
          }
        }

        setHours(updatedHours)
        await addLogEntry(`Universal time applied: ${universalStart} - ${universalEnd}`)
        setSnackbar({
          open: true,
          message: 'Successfully applied universal time to all days',
          severity: 'success'
        })
      } catch (error) {
        console.error('Error updating days with universal time:', error)
        setSnackbar({
          open: true,
          message: `Error applying universal time: ${error.message}`,
          severity: 'error'
        })
        setUseUniversal(false) // Revert the toggle if there's an error
      }
    } else {
      // If disabling universal time, fetch the original data from Firestore
      await fetchDays()
      await addLogEntry('Universal time disabled')
    }
  }

  const handleSave = async (index) => {
    try {
      const dayData = hours[index]
      if (dayData.id) {
        // Update existing document
        const dayDoc = doc(db, 'days', dayData.id)
        await updateDoc(dayDoc, {
          status: dayData.status,
          startTime: dayData.startTime,
          endTime: dayData.endTime
        })
      } else {
        // Create new document
        const daysCollection = collection(db, 'days')
        const newDocRef = await addDoc(daysCollection, {
          name: dayData.name,
          status: dayData.status,
          startTime: dayData.startTime,
          endTime: dayData.endTime
        })
        // Update the state with the new document ID
        const newHours = [...hours]
        newHours[index].id = newDocRef.id
        setHours(newHours)
      }
      await addLogEntry(
        `Opening hours updated for ${dayData.name}: ${dayData.startTime} - ${dayData.endTime}`
      )
      setSnackbar({
        open: true,
        message: `Successfully updated ${dayData.name}`,
        severity: 'success'
      })
    } catch (error) {
      console.error('Error updating/creating day:', error)
      setSnackbar({
        open: true,
        message: `Error updating ${hours[index].name}: ${error.message}`,
        severity: 'error'
      })
    }
  }

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return
    }
    setSnackbar({ ...snackbar, open: false })
  }

  return (
    <Box sx={{ margin: 'auto', pt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Regular weekly hours
      </Typography>

      {/* Universal time settings */}
      <Box sx={{ mb: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Set Universal Time
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={3}>
            <TextField
              type="time"
              value={universalStart}
              onChange={(e) => handleUniversalTimeChange('start', e.target.value)}
              size="small"
              label="Universal Start"
              InputLabelProps={{
                shrink: true
              }}
              inputProps={{
                step: 300 // 5 min
              }}
            />
          </Grid>
          <Grid item xs={3}>
            <TextField
              type="time"
              value={universalEnd}
              onChange={(e) => handleUniversalTimeChange('end', e.target.value)}
              size="small"
              label="Universal End"
              InputLabelProps={{
                shrink: true
              }}
              inputProps={{
                step: 300 // 5 min
              }}
            />
          </Grid>
          <Grid item xs={6}>
            <Button
              variant="contained"
              color={useUniversal ? 'secondary' : 'primary'}
              onClick={handleUniversalToggle}
            >
              {useUniversal ? 'Disable Universal Time' : 'Apply Universal Time'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      <Grid container spacing={2} alignItems="center" sx={{ py: 1, fontWeight: 'bold' }}>
        <Grid item xs={1}></Grid>
        <Grid item xs={2}>
          Day
        </Grid>
        <Grid item xs={3}>
          Start Time
        </Grid>
        <Grid item xs={1}></Grid>
        <Grid item xs={3}>
          End Time
        </Grid>
        <Grid item xs={2}></Grid>
      </Grid>
      {hours.map((day, index) => (
        <React.Fragment key={day.id || day.name}>
          <Grid container spacing={2} alignItems="center" sx={{ py: 0.4 }}>
            <Grid item xs={1}>
              <Switch checked={day.status} onChange={() => handleToggle(index)} color="primary" />
            </Grid>
            <Grid item xs={2}>
              <Typography>{day.name}</Typography>
            </Grid>
            <Grid item xs={3}>
              <TextField
                type="time"
                value={day.startTime}
                size="small"
                onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)}
                disabled={!day.status || useUniversal}
                InputLabelProps={{
                  shrink: true
                }}
                inputProps={{
                  step: 300 // 5 min
                }}
                sx={{ width: 150 }}
              />
            </Grid>
            <Grid item xs={1}></Grid>
            <Grid item xs={3}>
              <TextField
                type="time"
                value={day.endTime}
                onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)}
                disabled={!day.status || useUniversal}
                size="small"
                InputLabelProps={{
                  shrink: true
                }}
                inputProps={{
                  step: 300 // 5 min
                }}
                sx={{ width: 150 }}
              />
            </Grid>
            <Grid item xs={2}>
              <IconButton onClick={() => handleSave(index)} color="primary" size="small">
                <DownloadDoneRounded />
              </IconButton>
            </Grid>
          </Grid>
          <Divider />
        </React.Fragment>
      ))}

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default OpeningHours
