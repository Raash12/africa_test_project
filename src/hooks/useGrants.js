import { useEffect, useState } from "react";
import { getGrants } from "@/services/grants/grantService";
import { getDonors } from "@/services/donors/donorService";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function useGrants() {
  const [grants, setGrants] = useState([]);
  const [donors, setDonors] = useState([]);
  const [programs, setPrograms] = useState([]); // Ku dar barnaamijyada
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrantsDonorsAndPrograms();
  }, []);

  const fetchGrantsDonorsAndPrograms = async () => {
    setLoading(true);
    try {
      // Soo qaado barnaamijyada toos uga soo bixi Firestore
      const programSnapshot = await getDocs(collection(db, "programs"));
      const programsData = programSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const [grantsData, donorsData] = await Promise.all([getGrants(), getDonors()]);
      
      // Khariidad ku samee grants si uu u lahaado xogta donor-ka iyo barnaamijka
      const enrichedGrants = grantsData.map(grant => {
        const matchedDonor = donorsData.find(d => d.id === grant.donorId);
        const matchedProgram = programsData.find(p => p.id === grant.programId);
        return {
          ...grant,
          donorName: matchedDonor ? matchedDonor.donorName : "Unknown Donor",
          programName: matchedProgram ? matchedProgram.programName : "Unknown Program"
        };
      });

      setGrants(enrichedGrants);
      setDonors(donorsData);
      setPrograms(programsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    grants,
    donors,
    programs, // Soo celi barnaamijyada
    loading,
    refreshGrants: fetchGrantsDonorsAndPrograms,
  };
}