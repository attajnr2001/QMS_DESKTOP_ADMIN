import React from "react";
import { Grid, Box } from "@mui/material";
import Current from "../components/Current";
import Activity from "../components/Activity";
import Pending from "../components/Pending";

const Services = () => {
  return (
    <Box sx={{ flexGrow: 1, height: "100%", backgroundColor: "#fafafa83" }}>
      <Grid container spacing={0} sx={{ height: "100%" }}>
        <Grid item xs={4} sx={{ height: "100%" }}>
          <Current />
        </Grid>
        <Grid item xs={4} sx={{ height: "100%" }}>
          <Pending />
        </Grid>
        <Grid item xs={4} sx={{ height: "100%" }}>
          <Activity />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Services;