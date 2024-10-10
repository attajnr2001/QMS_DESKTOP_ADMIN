import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  TextField,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../helpers/firebase";

const MetricCard = ({ value, label, change, unit = "" }) => {
  const isPositiveChange = change >= 0;
  return (
    <Box>
      <Typography
        variant="h4"
        component="div"
        fontWeight="bold"
        color="primary"
      >
        {value}
        {unit}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Box display="flex" alignItems="center" mt={1}>
        {isPositiveChange ? (
          <TrendingUpIcon color="success" fontSize="small" />
        ) : (
          <TrendingDownIcon color="error" fontSize="small" />
        )}
        <Typography
          variant="body2"
          color={isPositiveChange ? "success.main" : "error.main"}
          ml={0.5}
        >
          {Math.abs(change.toFixed(2))}% prev. day
        </Typography>
      </Box>
    </Box>
  );
};

const TodayAnalysis = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [metrics, setMetrics] = useState({
    customers: { value: 0, change: 0 },
    avgWaitTime: { value: 0, change: 0 },
    avgServiceTime: { value: 0, change: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const queuesRef = collection(db, "queues");
        const todayStart = new Date(selectedDate);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(selectedDate);
        todayEnd.setHours(23, 59, 59, 999);

        const lastWeekStart = new Date(todayStart);
        lastWeekStart.setDate(lastWeekStart.getDate() - 1);
        const lastWeekEnd = new Date(todayEnd);
        lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

        const todayQuery = query(
          queuesRef,
          where("joinedOn", ">=", Timestamp.fromDate(todayStart)),
          where("joinedOn", "<=", Timestamp.fromDate(todayEnd))
        );

        const lastWeekQuery = query(
          queuesRef,
          where("joinedOn", ">=", Timestamp.fromDate(lastWeekStart)),
          where("joinedOn", "<=", Timestamp.fromDate(lastWeekEnd))
        );

        const [todaySnapshot, lastWeekSnapshot] = await Promise.all([
          getDocs(todayQuery),
          getDocs(lastWeekQuery),
        ]);

        const todayData = todaySnapshot.docs.map((doc) => doc.data());
        const lastWeekData = lastWeekSnapshot.docs.map((doc) => doc.data());

        const calculateMetrics = (data) => ({
          customers: data.length,
          avgWaitTime:
            data.reduce((sum, queue) => sum + queue.waitingTime, 0) /
              data.length || 0,
          avgServiceTime:
            data.reduce((sum, queue) => sum + queue.servingTime, 0) /
              data.length || 0,
        });

        const todayMetrics = calculateMetrics(todayData);
        const lastWeekMetrics = calculateMetrics(lastWeekData);

        const calculateChange = (today, lastWeek) =>
          lastWeek === 0 ? 100 : ((today - lastWeek) / lastWeek) * 100;

        setMetrics({
          customers: {
            value: todayMetrics.customers,
            change: calculateChange(
              todayMetrics.customers,
              lastWeekMetrics.customers
            ),
          },
          avgWaitTime: {
            value: Math.round(todayMetrics.avgWaitTime),
            change: calculateChange(
              todayMetrics.avgWaitTime,
              lastWeekMetrics.avgWaitTime
            ),
          },
          avgServiceTime: {
            value: Math.round(todayMetrics.avgServiceTime),
            change: calculateChange(
              todayMetrics.avgServiceTime,
              lastWeekMetrics.avgServiceTime
            ),
          },
        });
      } catch (error) {
        console.error("Error fetching queue data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate]);

  const handleDateChange = (event) => {
    setSelectedDate(new Date(event.target.value));
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 200,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" gutterBottom fontWeight={"bold"}>
          Today Analysis
        </Typography>
        <TextField
          label="Select Date"
          size="small"
          type="date"
          value={selectedDate.toISOString().split("T")[0]}
          onChange={handleDateChange}
          sx={{
            width: 200,
          }}
          InputLabelProps={{
            shrink: true,
          }}
        />
      </Box>
      <Grid container spacing={4}>
        <Grid item xs={12} sm={4}>
          <MetricCard
            value={metrics.customers.value}
            label="Customers"
            change={metrics.customers.change}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            value={metrics.avgWaitTime.value}
            label="Avg wait time"
            change={metrics.avgWaitTime.change}
            unit=" min"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            value={metrics.avgServiceTime.value}
            label="Avg service time"
            change={metrics.avgServiceTime.change}
            unit=" min"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TodayAnalysis;
