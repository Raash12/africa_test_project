import {
  collection,
  addDoc,
  getDocs,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

const projectRef = collection(db, "projects");

export const createProject = async (data) => {
  return await addDoc(projectRef, {
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const getProjects = async () => {
  const snapshot = await getDocs(projectRef);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const updateProject = async (id, data) => {
  const projectDoc = doc(db, "projects", id);
  return await updateDoc(projectDoc, data);
};

export const deleteProject = async (id) => {
  const projectDoc = doc(db, "projects", id);
  return await deleteDoc(projectDoc);
};