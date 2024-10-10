import React, { useState } from "react";
import { Grid, Box, Typography, Paper } from "@mui/material";
import WeeklyComparisonChart from "../components/WeeklyComparisonChart";

const DataAnalysis = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={5}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <WeeklyComparisonChart selectedDate={selectedDate} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DataAnalysis;