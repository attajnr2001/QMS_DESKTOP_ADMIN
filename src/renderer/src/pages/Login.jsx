import React, { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Grid,
  Paper,
  Snackbar,
  Alert,
  Avatar
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import api from '../helpers/axios'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const response = await api.post('/users/login', {
        email,
        password
      })

      // If login is successful
      if (response.data.success) {
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user))

        // Navigate to admin dashboard
        navigate('/admin/overview/today')
      }
    } catch (error) {
      // Handle login errors
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(error.response.data.error || 'Login failed')
      } else if (error.request) {
        // The request was made but no response was received
        setError('No response from server. Please check your connection.')
      } else {
        setError('An unexpected error occurred')
      }
      console.error('Login error:', error)
    }
  }

  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
      <Grid
        item
        xs={12}
        sm={8}
        md={6}
        component={Paper}
        elevation={6}
        square
        sx={{
          backgroundColor: 'primary.main',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 4
        }}
      >
        <Box
          component="form"
          onSubmit={handleLogin}
          sx={{
            my: 8,
            mx: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            width: '100%',
            maxWidth: 400
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            sx={{ mb: 2, fontWeight: 'bold', fontFamily: 'Pacifico' }}
          >
            QUEBE
          </Typography>
          <Typography component="h2" variant="h4" sx={{ mb: 2 }}>
            Log in
          </Typography>

          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            autoFocus
            variant="standard"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{
              mb: 2,
              input: { color: 'white' },
              label: { color: 'white' }
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            variant="standard"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{
              mb: 2,
              input: { color: 'white' },
              label: { color: 'white' }
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
              backgroundColor: 'white',
              color: 'primary.main'
            }}
          >
            Log in!
          </Button>
        </Box>
      </Grid>
      <Grid
        item
        xs={false}
        sm={4}
        md={6}
        sx={{
          backgroundColor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Hi, I'm Nana!
          </Typography>
          <Typography variant="body1" gutterBottom>
            I will help you get the most out of QUEBE.
          </Typography>
          <Avatar
            alt="Nana Akua"
            src="https://firebasestorage.googleapis.com/v0/b/ourqms-db48c.appspot.com/o/WhatsApp%20Image%202024-09-21%20at%2016.03.25.jpg?alt=media&token=b9337e9d-be77-49b9-abf6-b1abe701ee04" // src="https://dashboard-assets.qminder.com/54836aada/img/pos/mirjam.png"
            sx={{ width: 250, height: 250, margin: '20px auto' }}
          />
          <Typography variant="h6" gutterBottom>
            Nana Akua
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Customer Success Manager
          </Typography>
        </Box>
      </Grid>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Grid>
  )
}

export default Login
