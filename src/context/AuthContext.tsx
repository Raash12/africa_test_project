import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        let userData;

        // 🔥 IF USER DOES NOT EXIST → CREATE DEFAULT
        if (!snap.exists()) {
          userData = {
            email: user.email,
            role: "Admin",
            createdAt: new Date(),
          };

          await setDoc(ref, userData);
        } else {
          userData = snap.data();
        }

        setCurrentUser({
          uid: user.uid,
          email: user.email,
          ...userData,
        });

        setRole(userData.role || "Admin");
      } else {
        setCurrentUser(null);
        setRole(null);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, role, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);