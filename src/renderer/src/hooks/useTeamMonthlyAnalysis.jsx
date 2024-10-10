import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../helpers/firebase";

const useTeamMonthlyAnalysis = (selectedMonth) => {
  const [teamAnalysis, setTeamAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamAnalysis = async () => {
      try {
        setLoading(true);

        // Parse the selectedMonth string
        const [year, month] = selectedMonth.split("-").map(Number);

        // Set the start of the month
        const startDate = new Date(year, month - 1, 1);
        startDate.setHours(0, 0, 0, 0);

        // Set the end of the month
        const endDate = new Date(year, month, 0);
        endDate.setHours(23, 59, 59, 999);

        // Fetch all tellers
        const tellersRef = collection(db, "tellers");
        const tellersSnapshot = await getDocs(tellersRef);
        const tellers = tellersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch queues for the selected month
        const queuesRef = collection(db, "queues");
        const queuesQuery = query(
          queuesRef,
          where("joinedOn", ">=", Timestamp.fromDate(startDate)),
          where("joinedOn", "<=", Timestamp.fromDate(endDate))
        );
        const queuesSnapshot = await getDocs(queuesQuery);
        const queues = queuesSnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        // Process data
        const tellerAnalysis = tellers.map((teller) => {
          const tellerQueues = queues.filter(
            (queue) => queue.teller === teller.id && queue.state === "completed"
          );
          const visitorsServed = tellerQueues.length;
          const totalServiceTime = tellerQueues.reduce(
            (total, queue) => total + (queue.servingTime || 0),
            0
          );
          const totalWaitingTime = tellerQueues.reduce(
            (total, queue) => total + (queue.waitingTime || 0),
            0
          );
          const avgServiceTime =
            visitorsServed > 0 ? totalServiceTime / visitorsServed : 0;
          const avgWaitingTime =
            visitorsServed > 0 ? totalWaitingTime / visitorsServed : 0;

          return {
            name: teller.name,
            visitorsServed,
            avgServiceTime: formatTime(avgServiceTime),
            totalServiceTime: formatTime(totalServiceTime),
            avgWaitingTime: formatTime(avgWaitingTime),
            totalWaitingTime: formatTime(totalWaitingTime),
          };
        });

        setTeamAnalysis(tellerAnalysis);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching team monthly analysis:", error);
        setLoading(false);
      }
    };

    fetchTeamAnalysis();
  }, [selectedMonth]);

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes * 60) % 60);
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return { teamAnalysis, loading };
};

export default useTeamMonthlyAnalysis;
