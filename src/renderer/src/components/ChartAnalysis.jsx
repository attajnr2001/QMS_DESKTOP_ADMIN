import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import LensIcon from "@mui/icons-material/Lens";

const ChartAnalysis = ({ weeklyData, selectedServices, selectedDays }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const analysis = useMemo(() => {
    if (!weeklyData || weeklyData.length === 0) {
      return { summary: "No data available for analysis.", insights: [] };
    }

    const totalVisits = weeklyData.reduce((total, day) => {
      selectedServices.forEach((service) => {
        total += day[service] || 0;
      });
      return total;
    }, 0);

    const avgVisitsPerDay = totalVisits / selectedDays.length;

    const serviceTotals = selectedServices.reduce((acc, service) => {
      acc[service] = weeklyData.reduce(
        (total, day) => total + (day[service] || 0),
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

    const busiestDay = weeklyData.reduce(
      (busiest, day) => {
        const dayTotal = selectedServices.reduce(
          (total, service) => total + (day[service] || 0),
          0
        );
        return dayTotal > busiest.total
          ? { day: day.day, total: dayTotal }
          : busiest;
      },
      { day: "", total: 0 }
    );

    const quietestDay = weeklyData.reduce(
      (quietest, day) => {
        const dayTotal = selectedServices.reduce(
          (total, service) => total + (day[service] || 0),
          0
        );
        return dayTotal < quietest.total
          ? { day: day.day, total: dayTotal }
          : quietest;
      },
      { day: "", total: Infinity }
    );

    return {
      summary: `Over the selected period, there were a total of ${totalVisits} visits across all selected services, averaging ${avgVisitsPerDay.toFixed(
        2
      )} visits per day.`,
      insights: [
        `The most popular service was "${mostPopularService}" with ${serviceTotals[mostPopularService]} visits.`,
        `The least popular service was "${leastPopularService}" with ${serviceTotals[leastPopularService]} visits.`,
        `The busiest day was ${busiestDay.day} with ${busiestDay.total} visits.`,
        `The quietest day was ${quietestDay.day} with ${quietestDay.total} visits.`,
      ],
    };
  }, [weeklyData, selectedServices, selectedDays]);

  return (
    <Card sx={{ maxWidth: 800, margin: "auto", mt: 4 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Chart Analysis
          </Typography>
          <IconButton
            aria-label="info"
            onClick={handlePopoverOpen}
            size="small"
            sx={{ ml: 1 }}
          >
            <InfoIcon />
          </IconButton>
          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={handlePopoverClose}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "left",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "left",
            }}
          >
            <Typography sx={{ p: 2 }}>
              This analysis is based on the selected services and days.
            </Typography>
          </Popover>
        </Box>
        <Typography variant="body2" color="text.secondary" paragraph>
          {analysis.summary}
        </Typography>
        <Typography variant="h6" gutterBottom>
          Key Insights:
        </Typography>
        <List>
          {analysis.insights.map((insight, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <LensIcon
                  sx={{ fontSize: 10, color: `hsl(${index * 60}, 70%, 50%)` }}
                />
              </ListItemIcon>
              <ListItemText primary={insight} />
            </ListItem>
          ))}
        </List>
        {/* <Box sx={{ height: 300, mt: 4 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              {selectedServices.map((service, index) => (
                <Bar
                  key={service}
                  dataKey={service}
                  fill={`hsl(${index * 60}, 70%, 50%)`}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Box> */}
      </CardContent>
    </Card>
  );
};

export default ChartAnalysis;