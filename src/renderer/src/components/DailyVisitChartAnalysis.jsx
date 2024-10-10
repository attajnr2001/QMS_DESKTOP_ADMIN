import React, { useState, useMemo } from "react";
import {
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Popover,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import LensIcon from "@mui/icons-material/Lens";

const DailyVisitChartAnalysis = ({ chartData, selectedServices }) => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const analysis = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return { summary: "No data available for analysis.", insights: [] };
    }

    const totalVisits = chartData.reduce((total, day) => {
      selectedServices.forEach((service) => {
        total += day[service] || 0;
      });
      return total;
    }, 0);

    const avgVisitsPerDay = totalVisits / chartData.length;

    const serviceTotals = selectedServices.reduce((acc, service) => {
      acc[service] = chartData.reduce(
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

    const busiestDay = chartData.reduce(
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

    const quietestDay = chartData.reduce(
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
      summary: `For the selected week, there were a total of ${totalVisits} visits across all services, averaging ${avgVisitsPerDay.toFixed(
        2
      )} visits per day.`,
      insights: [
        `The most popular service was "${mostPopularService}" with ${serviceTotals[mostPopularService]} visits.`,
        `The least popular service was "${leastPopularService}" with ${serviceTotals[leastPopularService]} visits.`,
        `The busiest day was Day ${busiestDay.day} with ${busiestDay.total} visits.`,
        `The quietest day was Day ${quietestDay.day} with ${quietestDay.total} visits.`,
      ],
    };
  }, [chartData, selectedServices]);

  return (
    <Card sx={{ maxWidth: 800, margin: "auto", mt: 4 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Weekly Visit Analysis
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
              This analysis is based on the selected week and services.
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
      </CardContent>
    </Card>
  );
};

export default DailyVisitChartAnalysis;