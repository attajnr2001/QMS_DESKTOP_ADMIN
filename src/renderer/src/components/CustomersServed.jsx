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
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const CustomersServed = () => {
  const [servedCustomers, setServedCustomers] = useState([]);
  const [desks, setDesks] = useState({});
  const [services, setServices] = useState({});
  const [serviceCounts, setServiceCounts] = useState({});
  const [totalSignIns, setTotalSignIns] = useState(0);

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
    const now = Timestamp.now();
    const startOfDay = new Date(now.toDate().setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.toDate().setHours(23, 59, 59, 999));

    const completedQuery = query(
      queueRef,
      where("state", "==", "completed"),
      where("completedOn", ">=", Timestamp.fromDate(startOfDay)),
      where("completedOn", "<=", Timestamp.fromDate(endOfDay))
    );

    const totalSignInsQuery = query(
      queueRef,
      where("joinedOn", ">=", Timestamp.fromDate(startOfDay)),
      where("joinedOn", "<=", Timestamp.fromDate(endOfDay))
    );

    const unsubscribeCompleted = onSnapshot(completedQuery, (snapshot) => {
      const customers = snapshot.docs.map((doc) => {
        const data = doc.data();
        fetchDeskAndService(data.desk, data.service);
        return {
          id: doc.id,
          ...data,
        };
      });

      // Sort customers by completedOn timestamp in descending order
      const sortedCustomers = customers.sort(
        (a, b) => b.completedOn.toMillis() - a.completedOn.toMillis()
      );

      setServedCustomers(sortedCustomers);

      // Calculate service counts
      const counts = sortedCustomers.reduce((acc, customer) => {
        acc[customer.service] = (acc[customer.service] || 0) + 1;
        return acc;
      }, {});
      setServiceCounts(counts);
    });

    const unsubscribeTotalSignIns = onSnapshot(
      totalSignInsQuery,
      (snapshot) => {
        setTotalSignIns(snapshot.size);
      }
    );

    return () => {
      unsubscribeCompleted();
      unsubscribeTotalSignIns();
    };
  }, []);

  return (
    <Paper elevation={1} sx={{ p: 2, height: "100%" }}>
      <Typography variant="h6" sx={{ color: "#2c3e50", fontWeight: "bold" }}>
        Customers served{" "}
        <span style={{ color: "#27ae60", fontSize: "1.5em" }}>
          {servedCustomers.length}
        </span>
        /{totalSignIns}
      </Typography>
      <Typography variant="body2" sx={{ color: "#7f8c8d", mb: 2 }}>
        {servedCustomers.length} customers out of {totalSignIns} sign-ins served
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        <Chip label={`All ${servedCustomers.length}`} color="primary" />
        {Object.entries(serviceCounts).map(([serviceId, count]) => (
          <Chip
            key={serviceId}
            label={`${services[serviceId] || "Loading..."}  ${count}`}
            color="default"
          />
        ))}
      </Box>
      {servedCustomers.length > 0 ? (
        servedCustomers.map((customer, index) => (
          <Box
            key={customer.id}
            sx={{
              mb: 2,
              pb: 2,
              borderBottom:
                index < servedCustomers.length - 1
                  ? "1px solid #ecf0f1"
                  : "none",
            }}
          >
            <Grid container alignItems="center">
              <Grid item xs={8}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  {customer.customerName}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#7f8c8d", fontWeight: "bold" }}
                >
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
                  <CheckCircleOutlineIcon
                    sx={{ fontSize: "small", mr: 0.5, color: "#27ae60" }}
                  />
                  <Typography variant="body2" sx={{ color: "#27ae60" }}>
                    {customer.totalTime} min
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        ))
      ) : (
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Typography
            variant="body1"
            sx={{ color: "#f39c12", fontWeight: "bold" }}
          >
            No customers have been served today
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default CustomersServed;
