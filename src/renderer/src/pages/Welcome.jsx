import React from 'react'
import { AppBar, Toolbar, Typography, Button, Container, Grid, Box } from '@mui/material'
import { Link } from 'react-router-dom'

const LandingPage = () => {
  return (
    <Box
      sx={{
        flexGrow: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              color: 'primary.main',
              fontWeight: 'bold',
              fontFamily: 'Pacifico'
            }}
          >
            QUEBE
          </Typography>
          {/* <Box sx={{ display: "flex", gap: 2 }}>
            {["Product", "Industries", "Enterprise", "Pricing", "Learn"].map(
              (item) => (
                <Link key={item} href="#" color="textPrimary" underline="none">
                  {item}
                </Link>
              )
            )}
          </Box> */}
          <Box sx={{ ml: 2 }}>
            <Button variant="outlined" color="primary" sx={{ mr: 1 }}>
              Log in
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
              Manage queues and reduce operational costs
            </Typography>
            <Typography variant="h5" paragraph color="textSecondary">
              Improve the waiting experience, gather service intelligence, and make data-driven
              decisions.
            </Typography>
            <Button variant="contained" color="primary" size="large" component={Link} to="/login">
              LOGIN
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box
              component="img"
              src="https://img.freepik.com/free-vector/office-concept-illustration_114360-1406.jpg?t=st=1726934327~exp=1726937927~hmac=adf510e641bb575f3284f41c457a98f9354233640c8fa1e6cd3399c54205d6a2&w=740"
              // src="https://www.qminder.com/resources/img/home-page-illustration.svg"
              alt="Queue management illustration"
              sx={{ width: '100%' }}
            />
          </Grid>
        </Grid>
      </Container>

      <Box component="footer" sx={{ bgcolor: 'grey.100', py: 3, mt: 'auto' }}>
        <Container maxWidth="lg">
          <Grid container justifyContent="space-between">
            <Grid item>
              <Typography color="textSecondary">Decrease wait times up to 70%</Typography>
            </Grid>
            <Grid item>
              <Typography color="textSecondary">Improve Customer Satisfaction</Typography>
            </Grid>
            <Grid item>
              <Typography color="textSecondary">Data Insight for Decision making</Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  )
}

export default LandingPage
