import React, { useState, useEffect, useCallback } from "react";
import {
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  IconButton,
} from "@mui/material";
import { db } from "../helpers/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

const TellersBusy = () => {
  const [showDesks, setShowDesks] = useState(true);
  const [servingQueues, setServingQueues] = useState([]);
  const [totalDesks, setTotalDesks] = useState(0);
  const [availableDesks, setAvailableDesks] = useState(0);
  const [tellers, setTellers] = useState({});
  const [services, setServices] = useState({});

  const updateDeskAvailability = useCallback(
    (busyDesks) => {
      setAvailableDesks((prevAvailable) => Math.max(0, totalDesks - busyDesks));
    },
    [totalDesks]
  );

  useEffect(() => {
    const now = Timestamp.now();
    const startOfDay = new Date(now.toDate().setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.toDate().setHours(23, 59, 59, 999));

    const queuesQuery = query(
      collection(db, "queues"),
      where("state", "==", "serving"),
      where("joinedOn", ">=", Timestamp.fromDate(startOfDay)),
      where("joinedOn", "<=", Timestamp.fromDate(endOfDay))
    );

    const unsubscribeQueues = onSnapshot(queuesQuery, async (snapshot) => {
      const queues = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const updatedQueues = await Promise.all(
        queues.map(async (queue) => {
          const tellerName = await getTellerName(queue.teller);
          const serviceName = await getServiceName(queue.service);
          return { ...queue, tellerName, serviceName };
        })
      );

      setServingQueues(updatedQueues);
      updateDeskAvailability(updatedQueues.length);
    });

    const desksQuery = query(collection(db, "desks"));
    const unsubscribeDesks = onSnapshot(desksQuery, (snapshot) => {
      setTotalDesks(snapshot.size);
      updateDeskAvailability(servingQueues.length);
    });

    return () => {
      unsubscribeQueues();
      unsubscribeDesks();
    };
  }, [updateDeskAvailability]);

  const getTellerName = async (tellerId) => {
    if (tellers[tellerId]) return tellers[tellerId];
    const tellerDoc = await getDoc(doc(db, "tellers", tellerId));
    if (tellerDoc.exists()) {
      const tellerName = tellerDoc.data().name;
      setTellers((prev) => ({ ...prev, [tellerId]: tellerName }));
      return tellerName;
    }
    return "Unknown Teller";
  };

  const getServiceName = async (serviceId) => {
    if (services[serviceId]) return services[serviceId];
    const serviceDoc = await getDoc(doc(db, "services", serviceId));
    if (serviceDoc.exists()) {
      const serviceName = serviceDoc.data().service;
      setServices((prev) => ({ ...prev, [serviceId]: serviceName }));
      return serviceName;
    }
    return "Unknown Service";
  };

  const toggleDesks = () => {
    setShowDesks(!showDesks);
  };

  return (
    <Paper
      elevation={1}
      sx={{ p: 2, height: "100%", display: "flex", flexDirection: "column" }}
    >
      <Typography variant="h6" sx={{ color: "#2c3e50", fontWeight: "bold" }}>
        Tellers busy
        <span style={{ color: "#27ae60", fontSize: "1.5em" }}>
          {servingQueues.length}
        </span>
        /{totalDesks}
      </Typography>
      <Typography variant="body2" sx={{ color: "#7f8c8d", mb: 1 }}>
        {servingQueues.length} teller{servingQueues.length !== 1 && "s"} out of{" "}
        {totalDesks} serving visitors
      </Typography>
      <Typography variant="body2" sx={{ color: "#7f8c8d", mb: 1 }}>
        {availableDesks} desk{availableDesks !== 1 && "s"} are available
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2,
        }}
      >
        <IconButton onClick={toggleDesks}>
          {showDesks ? (
            <ExpandLessIcon sx={{ color: "#bdc3c7" }} />
          ) : (
            <ExpandMoreIcon sx={{ color: "#bdc3c7" }} />
          )}
        </IconButton>
      </Box>
      {showDesks && (
        <>
          {servingQueues.map((queue) => (
            <Card
              key={queue.id}
              variant="outlined"
              sx={{ mb: 2, bgcolor: "#f9f9f9" }}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar sx={{ bgcolor: "#bdc3c7" }}>
                    {queue.tellerName ? queue.tellerName[0] : "T"}
                  </Avatar>
                  <Box>
                    <Typography sx={{ color: "#2c3e50" }}>
                      <strong>{queue.tellerName}</strong> is serving{" "}
                      <strong>{queue.queueCode}</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#7f8c8d" }}>
                      in {queue.serviceName}
                    </Typography>
                  </Box>
                  <Typography sx={{ ml: "auto", color: "#e74c3c" }}>
                    {`${queue.waitingTime} min`}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
          {availableDesks > 0 &&
            Array.from({ length: availableDesks }).map((_, idx) => (
              <Card
                key={`available-${idx}`}
                variant="outlined"
                sx={{ mb: 2, bgcolor: "#f9f9f9" }}
              >
                <CardContent>
                  <Typography sx={{ color: "#bdc3c7" }}>
                    DESK {servingQueues.length + idx + 1}
                  </Typography>
                  <Typography sx={{ color: "#bdc3c7" }}>
                    Desk is available
                  </Typography>
                </CardContent>
              </Card>
            ))}
        </>
      )}
    </Paper>
  );
};

export default TellersBusy;