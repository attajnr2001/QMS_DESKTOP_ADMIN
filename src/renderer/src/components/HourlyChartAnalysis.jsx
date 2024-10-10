import React from "react";
import {
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import LensIcon from "@mui/icons-material/Lens";

const HourlyChartAnalysis = ({ chartData, activeServices, selectedDate }) => {
  if (!chartData || chartData.length === 0 || activeServices.length === 0) {
    return (
      <Paper sx={{ p: 2, maxWidth: 400 }}>
        <Typography variant="body2">No data available for analysis.</Typography>
      </Paper>
    );
  }

  const totalVisits = chartData.reduce((total, hour) => {
    activeServices.forEach((service) => {
      total += hour[service] || 0;
    });
    return total;
  }, 0);

  const avgVisitsPerHour = totalVisits / 24;

  const serviceTotals = activeServices.reduce((acc, service) => {
    acc[service] = chartData.reduce(
      (total, hour) => total + (hour[service] || 0),
      0
    );
    return acc;
  }, {});

  const mostPopularService = Object.entries(serviceTotals).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0];
  const leastPopularService = Object.entries(serviceTotals).reduce((a, b) =>
    a[1] < b[1] ? a : b
  )[0];

  const busiestHour = chartData.reduce(
    (busiest, hour) => {
      const hourTotal = activeServices.reduce(
        (total, service) => total + (hour[service] || 0),
        0
      );
      return hourTotal > busiest.total
        ? { hour: hour.hour, total: hourTotal }
        : busiest;
    },
    { hour: "", total: 0 }
  );

  const quietestHour = chartData.reduce(
    (quietest, hour) => {
      const hourTotal = activeServices.reduce(
        (total, service) => total + (hour[service] || 0),
        0
      );
      return hourTotal < quietest.total && hourTotal > 0
        ? { hour: hour.hour, total: hourTotal }
        : quietest;
    },
    { hour: "", total: Infinity }
  );

  const analysis = {
    summary: `On ${selectedDate.toDateString()}, there were a total of ${totalVisits} visits across all selected services, averaging ${avgVisitsPerHour.toFixed(
      2
    )} visits per hour.`,
    insights: [
      `The most popular service was "${mostPopularService}" with ${serviceTotals[mostPopularService]} visits.`,
      `The least popular service was "${leastPopularService}" with ${serviceTotals[leastPopularService]} visits.`,
      `The busiest hour was ${busiestHour.hour}:00 with ${busiestHour.total} visits.`,
      `The quietest hour with visits was ${quietestHour.hour}:00 with ${quietestHour.total} visits.`,
    ],
  };

  return (
    <Paper sx={{ p: 2, maxWidth: 400 }}>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Chart Analysis
      </Typography>
      <Typography variant="body2" paragraph>
        {analysis.summary}
      </Typography>
      <Typography variant="subtitle2" gutterBottom>
        Key Insights:
      </Typography>
      <List dense>
        {analysis.insights.map((insight, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <LensIcon sx={{ fontSize: 8 }} />
            </ListItemIcon>
            <ListItemText primary={insight} />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default HourlyChartAnalysis;