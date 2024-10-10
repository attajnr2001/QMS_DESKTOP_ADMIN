import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Box, Typography } from "@mui/material";

const TeamAnalysisChart = ({ teamAnalysis }) => {
  const metrics = [
    { key: "visitorsServed", color: "#8884d8", label: "Visitors Served" },
    { key: "avgServiceTime", color: "#82ca9d", label: "Avg Service Time" },
    { key: "totalServiceTime", color: "#ffc658", label: "Total Service Time" },
    { key: "avgWaitingTime", color: "#ff8042", label: "Avg Waiting Time" },
    { key: "totalWaitingTime", color: "#a4de6c", label: "Total Waiting Time" },
  ];

  const barSize = Math.max(5, 30 / Object.keys(metrics).length);

  const chartData = metrics.map((metric) => ({
    name: metric.label,
    ...teamAnalysis.reduce(
      (acc, teller) => ({
        ...acc,
        [teller.name]: parseFloat(teller[metric.key]),
      }),
      {}
    ),
  }));

  const tellers = teamAnalysis.map((teller) => teller.name);
  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff8042",
    "#a4de6c",
    "#8dd1e1",
    "#d0ed57",
    "#83a6ed",
  ];

  return (
    <Box sx={{ width: "100%", height: 500, mt: 4 }}>
      <Typography variant="h5" gutterBottom fontWeight={"bold"}>
        Team Performance Comparison
      </Typography>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={150} />
          <Tooltip />
          <Legend />
          {tellers.map((teller, index) => (
            <Bar
              key={teller}
              dataKey={teller}
              fill={colors[index % colors.length]}
              name={teller}
              barSize={barSize}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default TeamAnalysisChart;