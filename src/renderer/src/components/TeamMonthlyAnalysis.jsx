import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Typography,
  Box,
  CircularProgress,
  TextField,
} from "@mui/material";
import useTeamMonthlyAnalysis from "../hooks/useTeamMonthlyAnalysis";
import TeamAnalysisChart from "./TeamAnalysisChart";

const TeamMonthlyAnalysis = () => {
  const [orderBy, setOrderBy] = useState("name");
  const [order, setOrder] = useState("asc");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });

  const { teamAnalysis, loading } = useTeamMonthlyAnalysis(selectedMonth);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedData = React.useMemo(() => {
    const comparator = (a, b) => {
      if (b[orderBy] < a[orderBy]) {
        return -1;
      }
      if (b[orderBy] > a[orderBy]) {
        return 1;
      }
      return 0;
    };

    return [...teamAnalysis].sort((a, b) => {
      return order === "desc" ? comparator(a, b) : -comparator(a, b);
    });
  }, [order, orderBy, teamAnalysis]);

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" gutterBottom fontWeight={"bold"}>
          Team Monthly Analysis
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
      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 400,
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table
            sx={{ minWidth: 650 }}
            aria-label="team monthly analysis table"
          >
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === "name"}
                    direction={orderBy === "name" ? order : "asc"}
                    onClick={() => handleRequestSort("name")}
                  >
                    Team member
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === "visitorsServed"}
                    direction={orderBy === "visitorsServed" ? order : "asc"}
                    onClick={() => handleRequestSort("visitorsServed")}
                  >
                    Visitors served
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === "avgServiceTime"}
                    direction={orderBy === "avgServiceTime" ? order : "asc"}
                    onClick={() => handleRequestSort("avgServiceTime")}
                  >
                    Avg service time
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === "totalServiceTime"}
                    direction={orderBy === "totalServiceTime" ? order : "asc"}
                    onClick={() => handleRequestSort("totalServiceTime")}
                  >
                    Total service time
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === "avgWaitingTime"}
                    direction={orderBy === "avgWaitingTime" ? order : "asc"}
                    onClick={() => handleRequestSort("avgWaitingTime")}
                  >
                    Avg waiting time
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={orderBy === "totalWaitingTime"}
                    direction={orderBy === "totalWaitingTime" ? order : "asc"}
                    onClick={() => handleRequestSort("totalWaitingTime")}
                  >
                    Total waiting time
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((row) => (
                <TableRow
                  key={row.name}
                  sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {row.name}
                  </TableCell>
                  <TableCell align="right">{row.visitorsServed}</TableCell>
                  <TableCell align="right">{row.avgServiceTime}</TableCell>
                  <TableCell align="right">{row.totalServiceTime}</TableCell>
                  <TableCell align="right">{row.avgWaitingTime}</TableCell>
                  <TableCell align="right">{row.totalWaitingTime}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ my: 3 }}>
        <TeamAnalysisChart teamAnalysis={sortedData} />
      </Box>
    </Box>
  );
};

export default TeamMonthlyAnalysis;