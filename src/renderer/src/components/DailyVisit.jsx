import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Box,
  Typography,
  CircularProgress,
  TextField,
  Chip,
  FormControlLabel,
  Switch,
  IconButton,
  Popover,
  Paper,
} from "@mui/material";
import InfoRoundedIcon from "@mui/icons-material/InfoRounded";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../helpers/firebase";
import DailyVisitChartAnalysis from "./DailyVisitChartAnalysis";

const DailyVisit = () => {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - yearStart) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + yearStart.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;
  });

  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [showAllServices, setShowAllServices] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleInfoClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleInfoClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesRef = collection(db, "services");
        const servicesSnapshot = await getDocs(servicesRef);
        const servicesData = servicesSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().service,
        }));
        setServices(servicesData); // so basically int means an integer
        setSelectedServices(servicesData.map((service) => service.name));
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };

    fetchServices();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const queuesRef = collection(db, "queues");

        const [year, week] = selectedWeek.split("-W");
        const weekStart = new Date(year, 0, 1 + (week - 1) * 7);
        weekStart.setDate(
          weekStart.getDate() +
            (weekStart.getDay() === 0 ? 1 : 2 - weekStart.getDay())
        );

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 5);

        const q = query(
          queuesRef,
          where("joinedOn", ">=", Timestamp.fromDate(weekStart)),
          where("joinedOn", "<", Timestamp.fromDate(weekEnd))
        );

        const querySnapshot = await getDocs(q);
        const queueData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        const dailyData = processQueueData(queueData, weekStart);
        setChartData(dailyData);
      } catch (error) {
        console.error("Error fetching queue data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedWeek, services, selectedServices, showAllServices]);

  const processQueueData = (queueData, weekStart) => {
    const dailyVisits = {};
    const serviceSet = new Set(
      showAllServices ? services.map((s) => s.name) : selectedServices
    );

    queueData.forEach((queue) => {
      const date = new Date(queue.joinedOn.toDate());
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) return; // Skip Sunday (0) and Saturday (6)

      const dayKey = date.toISOString().split("T")[0];
      const serviceId = queue.service;
      const serviceName =
        services.find((s) => s.id === serviceId)?.name || "Unknown Service";

      if (serviceSet.has(serviceName)) {
        if (!dailyVisits[dayKey]) {
          dailyVisits[dayKey] = {};
        }
        if (!dailyVisits[dayKey][serviceName]) {
          dailyVisits[dayKey][serviceName] = 0;
        }
        dailyVisits[dayKey][serviceName]++;
      }
    });

    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const allDays = weekdays.map((_, i) => {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      return day.toISOString().split("T")[0];
    });

    return allDays.map((day, index) => {
      const dayData = { day: weekdays[index] };
      serviceSet.forEach((serviceName) => {
        dayData[serviceName] =
          (dailyVisits[day] && dailyVisits[day][serviceName]) || 0;
      });
      return dayData;
    });
  };

  const handleWeekChange = (event) => {
    setSelectedWeek(event.target.value);
  };

  const handleServiceToggle = (serviceName) => {
    if (!showAllServices) {
      setSelectedServices((prev) =>
        prev.includes(serviceName)
          ? prev.filter((s) => s !== serviceName)
          : [...prev, serviceName]
      );
    }
  };

  const handleShowAllToggle = (event) => {
    setShowAllServices(event.target.checked);
  };

  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#a4de6c",
    "#d0ed57",
    "#ffc0cb",
    "#40e0d0",
    "#ff6347",
    "#ba55d3",
  ];

  const activeServices = showAllServices
    ? services.map((s) => s.name)
    : selectedServices;
  const barSize = Math.max(5, 30 / activeServices.length);

  return (
    <Box sx={{ width: "100%", height: 550 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Daily Visits
          </Typography>
          <IconButton aria-label="info" onClick={handleInfoClick}>
            <InfoRoundedIcon />
          </IconButton>
        </Box>
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleInfoClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
        >
          <Paper sx={{ p: 2, maxWidth: 800 }}>
            <DailyVisitChartAnalysis
              chartData={chartData}
              selectedServices={activeServices}
            />
          </Paper>
        </Popover>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <TextField
            label="Select Week"
            size="small"
            type="week"
            value={selectedWeek}
            onChange={handleWeekChange}
            sx={{ width: 200 }}
            InputLabelProps={{ shrink: true }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={showAllServices}
                onChange={handleShowAllToggle}
                name="showAllServices"
              />
            }
            label="Show All Services"
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="body1">Services:</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {services.map((service) => (
              <Chip
                key={service.id}
                label={service.name}
                onClick={() => handleServiceToggle(service.name)}
                color={
                  showAllServices || selectedServices.includes(service.name)
                    ? "primary"
                    : "default"
                }
                disabled={showAllServices}
              />
            ))}
          </Box>
        </Box>
      </Box>
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "75%",
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <ResponsiveContainer width="100%" height="75%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Legend />
            {activeServices.map((serviceName, index) => (
              <Bar
                key={serviceName}
                dataKey={serviceName}
                fill={colors[index % colors.length]}
                barSize={barSize}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
};

export default DailyVisit;