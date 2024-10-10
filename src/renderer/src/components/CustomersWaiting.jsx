import React, { useState, useEffect } from "react";
import { Paper, Typography, Box, Chip, Grid } from "@mui/material";
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
import AccessTimeIcon from "@mui/icons-material/AccessTime";

const CustomersWaiting = () => {
  const [waitingCustomers, setWaitingCustomers] = useState([]);
  const [desks, setDesks] = useState({});
  const [services, setServices] = useState({});
  const [serviceCounts, setServiceCounts] = useState({});

  useEffect(() => {
    const fetchDeskAndService = async (deskId, serviceId) => {
      const deskDoc = await getDoc(doc(db, "desks", deskId));
      const serviceDoc = await getDoc(doc(db, "services", serviceId));

      setDesks((prev) => ({
        ...prev,
        [deskId]: deskDoc.data()?.name || "Unknown Desk",
      }));
      setServices((prev) => ({
        ...prev,
        [serviceId]: serviceDoc.data()?.service || "Unknown Service",
      }));
    };

    const queueRef = collection(db, "queues");
    const q = query(queueRef, where("state", "==", "waiting"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Timestamp.now();
      const startOfDay = new Date(now.toDate().setHours(0, 0, 0, 0));
      const endOfDay = new Date(now.toDate().setHours(23, 59, 59, 999));

      const customers = snapshot.docs
        .map((doc) => {
          const data = doc.data();

          // Fetch desk and service names
          fetchDeskAndService(data.desk, data.service);

          return {
            id: doc.id,
            ...data,
            waitTime: Math.floor(
              (now.toMillis() - data.joinedOn.toMillis()) / 60000
            ),
          };
        })
        .filter((customer) => {
          const joinedOn = customer.joinedOn.toDate();
          return joinedOn >= startOfDay && joinedOn <= endOfDay;
        });

      setWaitingCustomers(customers);

      // Calculate service counts
      const counts = customers.reduce((acc, customer) => {
        acc[customer.service] = (acc[customer.service] || 0) + 1;
        return acc;
      }, {});
      setServiceCounts(counts);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Paper elevation={1} sx={{ p: 2, height: "100%" }}>
      <Typography variant="h6" sx={{ fontWeight: "bold", color: "#2c3e50" }}>
        Customers waiting{" "}
        <span style={{ color: "#27ae60", fontSize: "1.5em" }}>
          {waitingCustomers.length}
        </span>
      </Typography>
      <Typography variant="body2" sx={{ color: "#7f8c8d", mb: 2 }}>
        {waitingCustomers.length} customers waiting
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        <Chip label={`All ${waitingCustomers.length}`} color="default" />
        {Object.entries(serviceCounts).map(([serviceId, count]) => (
          <Chip
            key={serviceId}
            label={`${services[serviceId] || "Loading..."}  ${count}`}
            color="default"
          />
        ))}
      </Box>
      {waitingCustomers.map((customer, index) => (
        <Box
          key={customer.id}
          sx={{
            mb: 2,
            pb: 2,
            borderBottom:
              index < waitingCustomers.length - 1
                ? "1px solid #ecf0f1"
                : "none",
          }}
        >
          <Grid container alignItems="center">
            <Grid item xs={8}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                {customer.customerName}
              </Typography>
              <Typography variant="body2" sx={{ color: "#7f8c8d" }}>
                {customer.queueCode}
              </Typography>
              <Chip
                label={`${services[customer.service] || "Loading..."}`}
                size="small"
                sx={{ backgroundColor: "#f2f2f2", mr: 1 }}
              />
              <Chip
                label={`${desks[customer.desk] || "Loading..."}`}
                size="small"
                sx={{ backgroundColor: "#f2f2f2" }}
              />
            </Grid>
            <Grid item xs={4} sx={{ textAlign: "right" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                }}
              >
                <AccessTimeIcon sx={{ fontSize: "small", mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: "#e74c3c" }}>
                  {customer.waitTime} min
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      ))}
    </Paper>
  );
};

export default CustomersWaiting;
