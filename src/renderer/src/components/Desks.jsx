import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Alert,
} from "@mui/material";
import { Add, Search } from "@mui/icons-material";
import { db } from "../helpers/firebase"; // Make sure this path is correct
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";

const AddDeskDialog = ({ open, onClose, onAdd }) => {
  const [deskName, setDeskName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));

  const handleAdd = async () => {
    if (deskName.trim() !== "") {
      setIsLoading(true);
      try {
        const docRef = await addDoc(collection(db, "desks"), {
          name: deskName,
          createdOn: serverTimestamp(),
          status: true,
        });
        onAdd(
          { id: docRef.id, name: deskName, status: true },
          "Desk added successfully!"
        );
        setDeskName("");
        onClose();
      } catch (error) {
        console.error("Error adding document: ", error);
        onAdd(null, "Error adding desk. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      PaperProps={{
        sx: {
          width: { xs: "90%", md: "50%" },
          maxWidth: "none",
        },
      }}
    >
      <DialogTitle>Add New Desk</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Desk Name"
          fullWidth
          value={deskName}
          onChange={(e) => setDeskName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleAdd}
          disabled={deskName.trim() === "" || isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : "Add Desk"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Desks = () => {
  const [desks, setDesks] = useState([]);
  const [filteredDesks, setFilteredDesks] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchDesks();
  }, []);

  useEffect(() => {
    filterDesks();
  }, [desks, searchTerm, filterStatus]);

  const fetchDesks = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "desks"));
      const desksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDesks(desksData);
    } catch (error) {
      console.error("Error fetching desks: ", error);
      setSnackbar({
        open: true,
        message: "Error fetching desks. Please try again.",
        severity: "error",
      });
    }
  };

  const filterDesks = () => {
    let filtered = desks;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((desk) =>
        desk.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (desk) => desk.status === (filterStatus === "enabled")
      );
    }

    setFilteredDesks(filtered);
  };

  const handleAddDesk = (newDesk, message) => {
    if (newDesk) {
      setDesks([...desks, newDesk]);
    }
    setSnackbar({
      open: true,
      message,
      severity: newDesk ? "success" : "error",
    });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterChange = (event) => {
    setFilterStatus(event.target.value);
  };

  const handleToggleStatus = async (deskId, currentStatus) => {
    try {
      const deskRef = doc(db, "desks", deskId);
      await updateDoc(deskRef, {
        status: !currentStatus,
      });

      setDesks(
        desks.map((desk) =>
          desk.id === deskId ? { ...desk, status: !currentStatus } : desk
        )
      );

      setSnackbar({
        open: true,
        message: `Desk status updated successfully!`,
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating desk status: ", error);
      setSnackbar({
        open: true,
        message: "Error updating desk status. Please try again.",
        severity: "error",
      });
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            size="small"
            placeholder="Find"
            InputProps={{
              startAdornment: <Search />,
            }}
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <Select
            size="small"
            value={filterStatus}
            onChange={handleFilterChange}
          >
            <MenuItem value="all">Enabled, Disabled</MenuItem>
            <MenuItem value="enabled">Enabled</MenuItem>
            <MenuItem value="disabled">Disabled</MenuItem>
          </Select>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          New desk
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">Name</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Edit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDesks.map((desk) => (
              <TableRow key={desk.id}>
                <TableCell align="center">{desk.name}</TableCell>
                <TableCell align="center">
                  <Switch
                    checked={desk.status}
                    onChange={() => handleToggleStatus(desk.id, desk.status)}
                  />
                </TableCell>
                <TableCell align="center">
                  <Button variant="outlined">Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <AddDeskDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onAdd={handleAddDesk}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Desks;