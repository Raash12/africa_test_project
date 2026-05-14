import { useEffect, useState } from "react";
import { getDonors } from "@/services/donors/donorService";

export default function useDonors() {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    const data = await getDonors();

    setDonors(data);
    setLoading(false);
  };

  return { donors,
    loading,
    refreshDonors: fetchDonors,
  };
}