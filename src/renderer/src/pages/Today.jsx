import React from "react";
import { Grid, Box } from "@mui/material";
import CustomersWaiting from "../components/CustomersWaiting";
import TellersBusy from "../components/TellersBusy";
import CustomersServed from "../components/CustomersServed";

const Today = () => {
  return (
    <Box sx={{ flexGrow: 1, height: "100%" }}>
      <Grid container spacing={0} sx={{ height: "100%" }}>
        <Grid item xs={4} sx={{ height: "100%" }}>
          <CustomersWaiting />
        </Grid>
        <Grid item xs={4} sx={{ height: "100%" }}>
          <TellersBusy />
        </Grid>
        <Grid item xs={4} sx={{ height: "100%" }}>
          <CustomersServed />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Today;