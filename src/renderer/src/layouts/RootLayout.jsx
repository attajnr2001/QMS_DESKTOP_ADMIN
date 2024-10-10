import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Box, Grid, Typography, Container } from "@mui/material";

const RootLayout = () => {
  return (
    <Box sx={{ backgroundColor: "#fafafa83" }}>
      <Navbar />
      <Container maxWidth sx={{ marginTop: "2rem" }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default RootLayout;