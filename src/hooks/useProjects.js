import { useEffect, useState } from "react";
import { getProjects } from "@/services/projects/projectService";
import { getGrants } from "@/services/grants/grantService";

export default function useProjects() {
  const [projects, setProjects] = useState([]);
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjectsAndGrants();
  }, []);

  const fetchProjectsAndGrants = async () => {
    setLoading(true);
    try {
      const [projectsData, grantsData] = await Promise.all([getProjects(), getGrants()]);
      
      // Khariidad ku samee projects si loo helo magaca rasmiga ah ee Grant-iga
      const enrichedProjects = projectsData.map(project => {
        const matchedGrant = grantsData.find(g => g.id === project.grantId);
        return {
          ...project,
          grantName: matchedGrant ? matchedGrant.grantName : "Direct/No Grant Link"
        };
      });

      setProjects(enrichedProjects);
      setGrants(grantsData);
    } catch (error) {
      console.error("Error fetching projects or grants:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    projects,
    grants,
    loading,
    refreshProjects: fetchProjectsAndGrants,
  };
}