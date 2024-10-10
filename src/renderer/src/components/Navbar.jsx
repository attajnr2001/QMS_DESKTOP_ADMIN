import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  const iconButtonStyle = (path) => ({
    color: isActive(path) ? "primary.main" : "inherit",
    borderBottom: isActive(path) ? "2px solid" : "none",
    borderRadius: 0,
    padding: "8px",
  });

  return (
    <AppBar position="static" color="default" elevation={0}>
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
          <Typography
            variant="h6"
            component="div"
            sx={{ color: "teal", fontWeight: "bold", fontFamily: "Pacifico" }}
          >
            QUEBE
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Overview">
          <IconButton
            onClick={() => navigate("/admin/overview")}
            sx={iconButtonStyle("/admin/overview")}
          >
            <HomeRoundedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Services">
          <IconButton
            onClick={() => navigate("/admin/services")}
            sx={iconButtonStyle("/admin/services")}
          >
            <DashboardRoundedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Data Insights">
          <IconButton
            onClick={() => navigate("/admin/dataInsights")}
            sx={iconButtonStyle("/admin/dataInsights")}
          >
            <InsightsRoundedIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Settings">
          <IconButton
            onClick={() => navigate("/admin/settings")}
            sx={iconButtonStyle("/admin/settings")}
          >
            <ConstructionRoundedIcon />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;