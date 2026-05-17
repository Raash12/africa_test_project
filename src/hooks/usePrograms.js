import { useEffect, useState } from "react";
import { getPrograms } from "@/services/program/programService";

export default function usePrograms() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgramsList();
  }, []);

  const fetchProgramsList = async () => {
    setLoading(true);
    try {
      const data = await getPrograms();
      setPrograms(data);
    } catch (error) {
      console.error("Error fetching programs:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    programs,
    loading,
    refreshPrograms: fetchProgramsList,
  };
}