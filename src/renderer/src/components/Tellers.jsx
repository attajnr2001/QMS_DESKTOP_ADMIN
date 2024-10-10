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
  Avatar,
} from "@mui/material";
import { Add, Search, MoreVert } from "@mui/icons-material";
import AddTellerDialog from "../dialog/AddTellerDialog";
import EditTellerDialog from "../dialog/EditTellerDialog";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../helpers/firebase";

const Tellers = () => {
  const [tellers, setTellers] = useState([]);
  const [desks, setDesks] = useState({});
  const [services, setServices] = useState({});
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTeller, setSelectedTeller] = useState(null);

  useEffect(() => {
    fetchTellers();
    fetchDesks();
    fetchServices();
  }, []);

  const fetchTellers = async () => {
    try {
      const q = query(collection(db, "tellers"));
      const querySnapshot = await getDocs(q);
      const tellersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTellers(tellersData);
    } catch (error) {
      console.error("Error fetching tellers: ", error);
    }
  };

  const fetchDesks = async () => {
    try {
      const q = query(collection(db, "desks"));
      const querySnapshot = await getDocs(q);
      const desksData = {};
      querySnapshot.docs.forEach((doc) => {
        desksData[doc.id] = doc.data().name;
      });
      setDesks(desksData);
    } catch (error) {
      console.error("Error fetching desks: ", error);
    }
  };

  const fetchServices = async () => {
    try {
      const q = query(collection(db, "services"));
      const querySnapshot = await getDocs(q);
      const servicesData = {};
      querySnapshot.docs.forEach((doc) => {
        servicesData[doc.id] = doc.data().service;
      });
      setServices(servicesData);
    } catch (error) {
      console.error("Error fetching services: ", error);
    }
  };

  const handleAddTeller = (newTeller) => {
    setTellers([...tellers, newTeller]);
  };

  const handleEditTeller = (updatedTeller) => {
    setTellers(
      tellers.map((t) => (t.id === updatedTeller.id ? updatedTeller : t))
    );
  };

  const handleEditClick = (teller) => {
    setSelectedTeller(teller);
    setEditDialogOpen(true);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterChange = (event) => {
    setFilterStatus(event.target.value);
  };

  const filteredTellers = tellers.filter((teller) => {
    const matchesSearch = teller.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "enabled" && teller.status) ||
      (filterStatus === "disabled" && !teller.status);
    return matchesSearch && matchesStatus;
  });

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
          New teller
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Services</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Edit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTellers.map((teller) => (
              <TableRow key={teller.id}>
                <TableCell>
                  <Avatar src={teller.image} />
                </TableCell>
                <TableCell>{teller.name}</TableCell>
                <TableCell>{desks[teller.desk] || "Unknown Desk"}</TableCell>
                <TableCell>
                  {teller.services
                    .map(
                      (serviceId) => services[serviceId] || "Unknown Service"
                    )
                    .join(", ")}
                </TableCell>
                <TableCell align="center">
                  <Switch checked={teller.status} />
                </TableCell>
                <TableCell align="center">
                  <Button
                    variant="outlined"
                    startIcon={<MoreVert />}
                    onClick={() => handleEditClick(teller)}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <AddTellerDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onAdd={handleAddTeller}
      />{" "}
      <EditTellerDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        teller={selectedTeller}
        onEdit={handleEditTeller}
        desks={Object.entries(desks).map(([id, name]) => ({ id, name }))}
        allServices={Object.entries(services).map(([id, service]) => ({
          id,
          service,
        }))}
      />
    </Box>
  );
};

export default Tellers;