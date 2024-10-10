import React, { useState, useEffect } from "react";
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
import useTeamAnalysisWeek from "../hooks/useTeamAnalysisWeek";
import TeamAnalysisChart from "./TeamAnalysisChart";

const TeamAnalysisWeek = () => {
  const [orderBy, setOrderBy] = useState("name");
  const [order, setOrder] = useState("asc");
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - yearStart) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + yearStart.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;
  });

  const [selectedWeekStart, setSelectedWeekStart] = useState(new Date());

  useEffect(() => {
    const [year, week] = selectedWeek.split("-W");
    const weekStart = new Date(year, 0, 1 + (week - 1) * 7);
    weekStart.setDate(
      weekStart.getDate() +
        (weekStart.getDay() === 0 ? -6 : 1) -
        weekStart.getDay()
    );
    setSelectedWeekStart(weekStart);
  }, [selectedWeek]);

  const { teamAnalysis, loading } = useTeamAnalysisWeek(selectedWeekStart);

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

  const handleWeekChange = (event) => {
    setSelectedWeek(event.target.value);
  };

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
          Team Analysis Week
        </Typography>
        <TextField
          label="Select Week"
          size="small"
          type="week"
          value={selectedWeek}
          onChange={handleWeekChange}
          sx={{
            width: 200,
          }}
          InputLabelProps={{
            shrink: true,
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
        <>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label="team analysis table">
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

          <Box sx={{ my: 3 }}>
            <TeamAnalysisChart teamAnalysis={sortedData} />
          </Box>
        </>
      )}
    </Box>
  );
};

export default TeamAnalysisWeek;