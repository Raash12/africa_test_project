import { useEffect, useState } from "react";
import { getBeneficiaries } from "@/services/beneficiaries/beneficiaryService";
import { getProjects } from "@/services/projects/projectService";

export default function useBeneficiaries() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBeneficiariesAndProjects();
  }, []);

  const fetchBeneficiariesAndProjects = async () => {
    setLoading(true);
    try {
      const [beneficiariesData, projectsData] = await Promise.all([
        getBeneficiaries(),
        getProjects()
      ]);
      
      // Enrichment: Ku lammaanee beneficiary kasta project-ga uu ku jiro
      const enriched = beneficiariesData.map(ben => {
        const matchedProject = projectsData.find(p => p.id === ben.projectId);
        return {
          ...ben,
          projectName: matchedProject ? matchedProject.name : "Unlinked Project"
        };
      });

      setBeneficiaries(enriched);
      setProjects(projectsData);
    } catch (error) {
      console.error("Error fetching beneficiaries or projects:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    beneficiaries,
    projects,
    loading,
    refreshBeneficiaries: fetchBeneficiariesAndProjects,
  };
}