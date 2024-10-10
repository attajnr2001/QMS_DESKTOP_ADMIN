import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Chip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  IconButton,
} from "@mui/material";
import ComputerIcon from "@mui/icons-material/Computer";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import SettingsIcon from "@mui/icons-material/Settings";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PersonIcon from "@mui/icons-material/Person";
import { db } from "../helpers/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc as firestoreDoc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";

const Current = () => {
  const [selectedDesk, setSelectedDesk] = useState("All Desks");
  const [selectedService, setSelectedService] = useState("All Services");
  const [waitingQueues, setWaitingQueues] = useState([]);
  const [servingQueues, setServingQueues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [desks, setDesks] = useState([]);
  const [services, setServices] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    serving: true,
    waiting: true,
  });

  const handleDeskChange = (event) => {
    setSelectedDesk(event.target.value);
  };

  const handleServiceChange = (event) => {
    setSelectedService(event.target.value);
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const fetchServiceName = async (serviceId) => {
    try {
      const serviceDoc = await getDoc(firestoreDoc(db, "services", serviceId));
      if (serviceDoc.exists()) {
        return serviceDoc.data().service;
      }
      return "Unknown Service";
    } catch (error) {
      console.error("Error fetching service name:", error);
      return "Error Loading Service";
    }
  };

  const fetchDeskName = async (deskId) => {
    try {
      const deskDoc = await getDoc(firestoreDoc(db, "desks", deskId));
      if (deskDoc.exists()) {
        return deskDoc.data().name;
      }
      return "Unknown Desk";
    } catch (error) {
      console.error("Error fetching desk name:", error);
      return "Error Loading Desk";
    }
  };

  const calculateWaitingTime = useCallback((joinedOn) => {
    if (!joinedOn) return 0;
    const now = new Date();
    const joinedTime = joinedOn.toDate();
    const waitingTime = Math.floor((now - joinedTime) / 60000); // in minutes
    return waitingTime;
  }, []);

  const calculateServingTime = useCallback((startServingTime) => {
    if (!startServingTime) return 0;
    const now = new Date();
    const startTime = startServingTime.toDate();
    const servingTime = Math.floor((now - startTime) / 60000); // in minutes
    return servingTime;
  }, []);

  useEffect(() => {
    const fetchQueues = async () => {
      try {
        // Fetch all desks
        const desksSnapshot = await getDocs(collection(db, "desks"));
        const desksData = desksSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDesks(desksData);

        // Fetch all services
        const servicesSnapshot = await getDocs(collection(db, "services"));
        const servicesData = servicesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setServices(servicesData);

        // Set up real-time listeners for waiting and serving queues
        const waitingQuery = query(
          collection(db, "queues"),
          where("state", "==", "waiting")
        );
        const servingQuery = query(
          collection(db, "queues"),
          where("state", "==", "serving")
        );

        const unsubscribeWaiting = onSnapshot(
          waitingQuery,
          async (snapshot) => {
            const queuesPromises = snapshot.docs.map(async (doc) => {
              const data = doc.data();
              const serviceName = await fetchServiceName(data.service);
              const deskName = await fetchDeskName(data.desk);
              const tellerDoc = await getDoc(
                firestoreDoc(db, "tellers", data.teller)
              );
              const tellerName = tellerDoc.exists()
                ? tellerDoc.data().name
                : "Unknown";
              return {
                id: doc.id,
                ...data,
                serviceName,
                deskName,
                tellerName,
                waitingTime: calculateWaitingTime(data.joinedOn),
              };
            });
            const queues = await Promise.all(queuesPromises);
            setWaitingQueues(queues);
          }
        );

        const unsubscribeServing = onSnapshot(
          servingQuery,
          async (snapshot) => {
            const queuesPromises = snapshot.docs.map(async (doc) => {
              const data = doc.data();
              const serviceName = await fetchServiceName(data.service);
              const deskName = await fetchDeskName(data.desk);
              const tellerDoc = await getDoc(
                firestoreDoc(db, "tellers", data.teller)
              );
              const tellerName = tellerDoc.exists()
                ? tellerDoc.data().name
                : "Unknown";
              return {
                id: doc.id,
                ...data,
                serviceName,
                deskName,
                tellerName,
                servingTime: calculateServingTime(data.startServingTime),
              };
            });
            const queues = await Promise.all(queuesPromises);
            setServingQueues(queues);
          }
        );

        setLoading(false);

        return () => {
          unsubscribeWaiting();
          unsubscribeServing();
        };
      } catch (error) {
        console.error("Error fetching queues:", error);
        setLoading(false);
      }
    };

    fetchQueues();
  }, [calculateWaitingTime, calculateServingTime]);

  // Update waiting and serving times every minute
  useEffect(() => {
    const intervalId = setInterval(() => {
      setWaitingQueues((prevQueues) =>
        prevQueues.map((queue) => ({
          ...queue,
          waitingTime: calculateWaitingTime(queue.joinedOn),
        }))
      );
      setServingQueues((prevQueues) =>
        prevQueues.map((queue) => ({
          ...queue,
          servingTime: calculateServingTime(queue.startServingTime),
        }))
      );
    }, 60000); // Update every minute

    return () => clearInterval(intervalId);
  }, [calculateWaitingTime, calculateServingTime]);

  // Filter queues based on selected desk and service
  const filteredWaitingQueues = waitingQueues.filter(
    (queue) =>
      (selectedDesk === "All Desks" || queue.desk === selectedDesk) &&
      (selectedService === "All Services" ||
        queue.serviceName === selectedService)
  );

  const filteredServingQueues = servingQueues.filter(
    (queue) =>
      (selectedDesk === "All Desks" || queue.desk === selectedDesk) &&
      (selectedService === "All Services" ||
        queue.serviceName === selectedService)
  );

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box sx={{ padding: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <ComputerIcon sx={{ mr: 1 }} />
        <FormControl sx={{ minWidth: 150, mr: 2 }} size="small">
          <InputLabel id="desk-select-label">Desk</InputLabel>
          <Select
            labelId="desk-select-label"
            id="desk-select"
            value={selectedDesk}
            label="Desk"
            onChange={handleDeskChange}
          >
            <MenuItem value="All Desks">All Desks</MenuItem>
            {desks.map((desk) => (
              <MenuItem key={desk.id} value={desk.id}>
                {desk.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 150, mr: 2 }} size="small">
          <InputLabel id="service-select-label">Service</InputLabel>
          <Select
            labelId="service-select-label"
            id="service-select"
            value={selectedService}
            label="Service"
            onChange={handleServiceChange}
          >
            <MenuItem value="All Services">All Services</MenuItem>
            {services.map((service) => (
              <MenuItem key={service.id} value={service.service}>
                {service.service}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Paper elevation={0} sx={{ mb: 2, p: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <IconButton onClick={() => toggleSection("serving")} size="small">
            {expandedSections.serving ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          <Typography variant="subtitle2">Serving now</Typography>
          <Chip
            label={filteredServingQueues.length}
            size="small"
            sx={{ ml: 1, minWidth: 20, height: 20 }}
          />
        </Box>

        {expandedSections.serving &&
          filteredServingQueues.map((queue) => (
            <Box
              key={queue.id}
              sx={{
                ml: 3,
                backgroundColor: "#f3b8601c",
                p: 1,
                borderRadius: 1,
                mb: 1,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                {queue.queueCode}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <AccessTimeIcon sx={{ fontSize: "small", mr: 0.5 }} />
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Serving time
                </Typography>
                <Chip
                  label={`${queue.servingTime} min`}
                  size="small"
                  sx={{ backgroundColor: "white" }}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <PersonIcon sx={{ fontSize: "small", mr: 0.5 }} />
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Teller:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {queue.tellerName}
                </Typography>
              </Box>
              <Chip
                label={queue.serviceName}
                size="small"
                sx={{ mt: 1, mr: 1, backgroundColor: "#e6e6fa" }}
              />
              <Chip
                label={queue.deskName}
                size="small"
                sx={{ mt: 1, backgroundColor: "#fff6e6" }}
              />
            </Box>
          ))}
      </Paper>

      <Paper elevation={0} sx={{ p: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <IconButton onClick={() => toggleSection("waiting")} size="small">
            {expandedSections.waiting ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          <Typography variant="subtitle2">Waiting</Typography>
          <Chip
            label={filteredWaitingQueues.length}
            size="small"
            sx={{ ml: 1, minWidth: 20, height: 20 }}
          />
          <SettingsIcon sx={{ ml: "auto", fontSize: "small" }} />
        </Box>

        {expandedSections.waiting &&
          filteredWaitingQueues.map((queue) => (
            <Box
              key={queue.id}
              sx={{
                ml: 3,
                backgroundColor: "#f0f8ff",
                p: 1,
                borderRadius: 1,
                mb: 1,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                {queue.queueCode}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <AccessTimeIcon sx={{ fontSize: "small", mr: 0.5 }} />
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Waiting time
                </Typography>
                <Chip
                  label={`${queue.waitingTime} min`}
                  size="small"
                  sx={{ backgroundColor: "white" }}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <PersonIcon sx={{ fontSize: "small", mr: 0.5 }} />
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Teller:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  {queue.tellerName}
                </Typography>
              </Box>
              <Chip
                label={queue.serviceName}
                size="small"
                sx={{ mt: 1, mr: 1, backgroundColor: "#e6e6fa" }}
              />
              <Chip
                label={queue.deskName}
                size="small"
                sx={{ mt: 1, backgroundColor: "#fff6e6" }}
              />
            </Box>
          ))}
      </Paper>
    </Box>
  );
};

export default Current;