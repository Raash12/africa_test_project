import { useEffect, useState } from "react";
import { getGrants } from "@/services/grants/grantService";
import { getDonors } from "@/services/donors/donorService";
import { getDocs, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function useGrants() {
  const [grants, setGrants] = useState([]);
  const [donors, setDonors] = useState([]);
  const [programs, setPrograms] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrantsDonorsAndPrograms();
  }, []);

  const fetchGrantsDonorsAndPrograms = async () => {
    setLoading(true);
    try {
      const [programSnapshot, accountsSnapshot] = await Promise.all([
        getDocs(collection(db, "programs")),
        getDocs(collection(db, "chart_of_accounts"))
      ]);
      const programsData = programSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const accountsData = accountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const [grantsData, donorsData] = await Promise.all([getGrants(), getDonors()]);
      
      const enrichedGrants = grantsData.map(grant => {
        const matchedDonor = donorsData.find(d => d.id === grant.donorId);
        const matchedProgram = programsData.find(p => p.id === grant.programId);
        const matchedAccount = accountsData.find(a => a.id === grant.receivingAccountId);
        const matchedRevenueAccount = accountsData.find(a => a.id === grant.revenueAccountId); // 🌟 CUSUB
        
        return {
          ...grant,
          donorName: matchedDonor ? matchedDonor.donorName : "Unknown Donor",
          programName: matchedProgram ? matchedProgram.programName : "Unknown Program",
          accountName: matchedAccount ? matchedAccount.accountName : "Cash/Bank Account",
          revenueAccountName: matchedRevenueAccount ? matchedRevenueAccount.accountName : "Grant Income" // 🌟 CUSUB
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

  return { grants, donors, programs, loading, refreshGrants: fetchGrantsDonorsAndPrograms };
}