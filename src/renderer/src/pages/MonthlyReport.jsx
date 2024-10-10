import React, { useState } from "react";
import { Grid, Box, Typography, Paper } from "@mui/material";
import MonthlyAnalysis from "../components/MonthlyAnalysis";
import MonthlyVisit from "../components/MonthlyVisit";
import TeamMonthlyAnalysis from "../components/TeamMonthlyAnalysis";

const MonthlyReport = () => {
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={5}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <MonthlyAnalysis />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <MonthlyVisit />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <TeamMonthlyAnalysis />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MonthlyReport;