import React, { useState } from "react";
import { Grid, Box, Typography, Paper } from "@mui/material";
import AllTimeAnalysis from "../components/AllTimeAnalysis";
import AllTimeVisit from "../components/AllTimeVisit";
import TeamAnalysisAllTime from "../components/TeamAnalysisAllTime";

const AllTime = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={5}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <AllTimeAnalysis selectedDate={selectedDate} />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <AllTimeVisit selectedDate={selectedDate} />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <TeamAnalysisAllTime selectedDate={selectedDate} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AllTime;