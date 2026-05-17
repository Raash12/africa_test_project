import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "firebase/firestore";

const projectCollection = collection(db, "projects");

export const createProject = (data) => addDoc(projectCollection, data);

export const getProjects = async () => {
  const snapshot = await getDocs(projectCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateProject = (id, data) => updateDoc(doc(db, "projects", id), data);
export const deleteProject = (id) => deleteDoc(doc(db, "projects", id));