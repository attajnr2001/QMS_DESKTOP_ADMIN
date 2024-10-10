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
          {Math.abs(change.toFixed(2))}% prev. month
        </Typography>
      </Box>
    </Box>
  );
};

const MonthlyAnalysis = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });

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
        const [year, month] = selectedMonth.split("-");
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

        const lastMonthStart = new Date(year, month - 2, 1);
        const lastMonthEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);

        const monthQuery = query(
          queuesRef,
          where("joinedOn", ">=", Timestamp.fromDate(monthStart)),
          where("joinedOn", "<=", Timestamp.fromDate(monthEnd))
        );

        const lastMonthQuery = query(
          queuesRef,
          where("joinedOn", ">=", Timestamp.fromDate(lastMonthStart)),
          where("joinedOn", "<=", Timestamp.fromDate(lastMonthEnd))
        );

        const [monthSnapshot, lastMonthSnapshot] = await Promise.all([
          getDocs(monthQuery),
          getDocs(lastMonthQuery),
        ]);

        const monthData = monthSnapshot.docs.map((doc) => doc.data());
        const lastMonthData = lastMonthSnapshot.docs.map((doc) => doc.data());

        const calculateMetrics = (data) => ({
          customers: data.length,
          avgWaitTime:
            data.reduce((sum, queue) => sum + queue.waitingTime, 0) /
              data.length || 0,
          avgServiceTime:
            data.reduce((sum, queue) => sum + queue.servingTime, 0) /
              data.length || 0,
        });

        const monthMetrics = calculateMetrics(monthData);
        const lastMonthMetrics = calculateMetrics(lastMonthData);

        const calculateChange = (current, previous) =>
          previous === 0 ? 100 : ((current - previous) / previous) * 100;

        setMetrics({
          customers: {
            value: monthMetrics.customers,
            change: calculateChange(
              monthMetrics.customers,
              lastMonthMetrics.customers
            ),
          },
          avgWaitTime: {
            value: Math.round(monthMetrics.avgWaitTime),
            change: calculateChange(
              monthMetrics.avgWaitTime,
              lastMonthMetrics.avgWaitTime
            ),
          },
          avgServiceTime: {
            value: Math.round(monthMetrics.avgServiceTime),
            change: calculateChange(
              monthMetrics.avgServiceTime,
              lastMonthMetrics.avgServiceTime
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
  }, [selectedMonth]);

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
          Monthly Analysis
        </Typography>
        <TextField
          label="Select Month"
          size="small"
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          sx={{
            width: 200,
          }}
          inputProps={{
            max: new Date().toISOString().slice(0, 7), // setting the max property here
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

export default MonthlyAnalysis;