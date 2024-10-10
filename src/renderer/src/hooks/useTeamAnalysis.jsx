import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../helpers/firebase";

const useTeamAnalysis = (selectedDate) => {
  const [teamAnalysis, setTeamAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamAnalysis = async () => {
      try {
        setLoading(true);

        // Set the time of the selected date to the start of the day
        const startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);

        // Set the end date to the end of the selected day
        const endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);

        // Fetch all tellers
        const tellersRef = collection(db, "tellers");
        const tellersSnapshot = await getDocs(tellersRef);
        const tellers = tellersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch completed queues for the selected date
        const queuesRef = collection(db, "queues");
        const queuesQuery = query(
          queuesRef,
          where("state", "==", "completed"),
          where("completedOn", ">=", startDate),
          where("completedOn", "<=", endDate)
        );
        const queuesSnapshot = await getDocs(queuesQuery);
        const queues = queuesSnapshot.docs.map((doc) => doc.data());

        // Process data
        const tellerAnalysis = tellers.map((teller) => {
          const tellerQueues = queues.filter(
            (queue) => queue.teller === teller.id
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
        console.error("Error fetching team analysis:", error);
        setLoading(false);
      }
    };

    fetchTeamAnalysis();
  }, [selectedDate]);

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

export default useTeamAnalysis;
