import React from "react";
import WeekAnalysis from "../components/WeekAnalysis";
import DailyVisit from "../components/DailyVisit";
import TeamAnalysisWeek from "../components/TeamAnalysisWeek";
import { Grid, Box, Paper } from "@mui/material";

const WeeklyReport = () => {
  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={5}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <WeekAnalysis />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <DailyVisit />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <TeamAnalysisWeek />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default WeeklyReport;