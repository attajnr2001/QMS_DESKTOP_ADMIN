import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "../helpers/firebase";

const useTeamAnalysisWeek = (selectedWeekStart) => {
  const [teamAnalysis, setTeamAnalysis] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamAnalysis = async () => {
      try {
        setLoading(true);

        // Set the start of the week
        const startDate = new Date(selectedWeekStart);
        startDate.setHours(0, 0, 0, 0);

        // Set the end of the week (7 days later)
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);

        // Fetch all tellers
        const tellersRef = collection(db, "tellers");
        const tellersSnapshot = await getDocs(tellersRef);
        const tellers = tellersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Fetch queues for the selected week
        const queuesRef = collection(db, "queues");
        const queuesQuery = query(
          queuesRef,
          where("joinedOn", ">=", Timestamp.fromDate(startDate)),
          where("joinedOn", "<", Timestamp.fromDate(endDate))
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
        console.error("Error fetching team analysis:", error);
        setLoading(false);
      }
    };

    fetchTeamAnalysis();
  }, [selectedWeekStart]);

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

export default useTeamAnalysisWeek;