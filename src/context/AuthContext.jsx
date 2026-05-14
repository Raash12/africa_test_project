import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        try {
          const ref = doc(db, "users", user.uid);
          const snap = await getDoc(ref);
          let userData;

          if (!snap.exists()) {
            // Kaliya haddii uu yahay qof cusub oo login sameeyay (Auto-admin)
            userData = {
              email: user.email,
              role: "Admin",
              createdAt: new Date().toISOString(),
            };
            await setDoc(ref, userData);
          } else {
            userData = snap.data();
          }

          setCurrentUser({ uid: user.uid, ...userData });
          setRole(userData.role || "Admin");
        } catch (error) {
          console.error("Auth Error:", error);
        }
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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};