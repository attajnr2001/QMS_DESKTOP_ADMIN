import React, { useState } from "react";
import { Grid, Box, Typography, Paper } from "@mui/material";
import TodayAnalysis from "../components/TodayAnalysis";
import HourlyVisit from "../components/HourlyVisit";
import TeamAnalysisToday from "../components/TeamAnalysisToday";

const DailyReport = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={5}>
        <Grid item xs={12} sx={{ my: 2 }}>
          <Paper sx={{ p: 2 }}>
            <TodayAnalysis selectedDate={selectedDate} />
          </Paper>
        </Grid>
        <Grid item xs={12} sx={{ my: 2 }}>
          <Paper sx={{ p: 2 }}>
            <HourlyVisit selectedDate={selectedDate} />
          </Paper>
        </Grid>
        <Grid item xs={12} sx={{ my: 2 }}>
          <Paper sx={{ p: 2 }}>
            <TeamAnalysisToday selectedDate={selectedDate} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DailyReport;