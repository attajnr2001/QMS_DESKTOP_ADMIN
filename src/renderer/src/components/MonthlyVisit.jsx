import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Typography,
  Box,
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
import MonthlyChartAnalysis from "./MonthlyChartAnalysis";

const MonthlyVisit = () => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
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

  const CustomXAxisTick = (props) => {
    const { x, y, payload } = props;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={-10}
          dy={16}
          textAnchor="middle"
          fill="#666"
          fontSize={12}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servicesRef = collection(db, "services");
        const servicesSnapshot = await getDocs(servicesRef);
        const servicesData = servicesSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().service,
        }));
        setServices(servicesData);
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
        const [year, month] = selectedMonth.split("-");
        const monthStart = new Date(year, month - 1, 1);
        const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

        const q = query(
          queuesRef,
          where("joinedOn", ">=", Timestamp.fromDate(monthStart)),
          where("joinedOn", "<=", Timestamp.fromDate(monthEnd))
        );

        const querySnapshot = await getDocs(q);
        const queueData = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        const dailyData = processQueueData(queueData);
        setChartData(dailyData);
      } catch (error) {
        console.error("Error fetching queue data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedMonth, services, selectedServices, showAllServices]);

  const processQueueData = (queueData) => {
    const dailyVisits = {};
    const serviceSet = new Set(
      showAllServices ? services.map((s) => s.name) : selectedServices
    );

    queueData.forEach((queue) => {
      const date = new Date(queue.joinedOn.toDate());
      const dayKey = date.getDate().toString().padStart(2, "0");
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

    const [year, month] = selectedMonth.split("-");
    const daysInMonth = new Date(year, month, 0).getDate();
    const allDays = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(year, month - 1, day);
      return date.getDay() !== 0 && date.getDay() !== 6
        ? day.toString().padStart(2, "0")
        : null;
    }).filter((day) => day !== null);

    return allDays.map((day) => {
      const dayData = { day };
      serviceSet.forEach((serviceName) => {
        dayData[serviceName] =
          (dailyVisits[day] && dailyVisits[day][serviceName]) || 0;
      });
      return dayData;
    });
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
    ["#8884d8", "#8884d820"],
    ["#82ca9d", "#82ca9d20"],
    ["#ffc658", "#ffc65820"],
    ["#ff7300", "#ff730020"],
    ["#a4de6c", "#a4de6c20"],
  ];

  const activeServices = showAllServices
    ? services.map((s) => s.name)
    : selectedServices;

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
            Monthly Visits
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
          <Paper sx={{ maxWidth: 800 }}>
            <MonthlyChartAnalysis
              chartData={chartData}
              selectedServices={activeServices}
              selectedMonth={selectedMonth}
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
            label="Select Month"
            size="small"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            sx={{ width: 200 }}
            inputProps={{
              max: new Date().toISOString().slice(0, 7),
            }}
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
          <AreaChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={<CustomXAxisTick />} />
            <YAxis />
            <Tooltip />
            <Legend />
            {activeServices.map((serviceName, index) => {
              const [mainColor, lightColor] = colors[index % colors.length];
              return (
                <React.Fragment key={serviceName}>
                  <defs>
                    <linearGradient
                      id={`gradient-${serviceName}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={mainColor}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={lightColor}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey={serviceName}
                    stroke={mainColor}
                    fillOpacity={1}
                    fill={`url(#gradient-${serviceName})`}
                  />
                </React.Fragment>
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Box>
  );
};

export default MonthlyVisit;