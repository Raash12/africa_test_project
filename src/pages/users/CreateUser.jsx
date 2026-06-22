import { useEffect, useState, useMemo } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, updateDoc, collection, getDocs } from "firebase/firestore";
import { Loader2, AlertCircle } from "lucide-react"; // 🌟 Waxaan soo qaatay icon-ka Alert-ka
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // 🌟 Soo dhoofso Shadcn Alert

export default function CreateUserForm({ editData, employees = [], onSuccess }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(""); // 🌟 State-kan ayaa xajinaya fariinta khaldka ee Alert-ka
  const [existingUserEmployeeIds, setExistingUserEmployeeIds] = useState([]);
  const [form, setForm] = useState({
    employeeId: "", email: "", password: "", confirmPassword: "", role: "", isActive: true,
  });

  // 1. Soo qaad dhamaan employeeId-yada hore koonto u lahaa si looga reebo liiska
  useEffect(() => {
    const fetchExistingUsers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const ids = snap.docs.map(doc => doc.data().employeeId).filter(Boolean);
        setExistingUserEmployeeIds(ids);
      } catch (err) {
        console.error("Error fetching existing users:", err);
      }
    };
    
    if (!editData) {
      fetchExistingUsers();
    }
  }, [editData]);

  useEffect(() => {
    if (editData) {
      setForm({ 
        ...editData, 
        password: "", 
        confirmPassword: "",
        isActive: editData.isActive ?? true 
      });
    }
  }, [editData]);

  // 2. Shaandhee shaqaalaha: Ka reeb kuwa akoonka hore u lahaa (Haddii aan la joogin Edit Mode)
  const availableEmployees = useMemo(() => {
    if (editData) return employees; 
    return employees.filter(emp => !existingUserEmployeeIds.includes(emp.id));
  }, [employees, existingUserEmployeeIds, editData]);

  const handleEmployeeChange = (id) => {
    const emp = employees.find((e) => e.id === id);
    if (emp) setForm((prev) => ({ ...prev, employeeId: id, email: emp.email || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError(""); // 🌟 Mar kasta oo foomka la re-submit gareeyo marka hore nadiifi error-ka hore

    if (!form.employeeId) {
      setError("Fadlan marka hore dooro qof shaqaale ah sxb!");
      return;
    }

    if (!form.role) {
      setError("Fadlan u dooro door (Role) isticmaalahan sxb!");
      return;
    }

    try {
      setIsLoading(true);
      if (editData) {
        await updateDoc(doc(db, "users", editData.id), {
          role: form.role,
          isActive: form.isActive,
        });
        toast.success("User updated successfully");
      } else {
        if (form.password.length < 6) {
          setError("Khafiif sxb! Password-ku waa inuu ka koobnaadaa ugu yaraan 6 xaraf.");
          setIsLoading(false);
          return;
        }

        if (form.password !== form.confirmPassword) {
          setError("Cillad: Labada Password isma laha (Match ma noqon)!");
          setIsLoading(false);
          return;
        }
        
        const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await setDoc(doc(db, "users", userCred.user.uid), {
          employeeId: form.employeeId,
          email: form.email,
          role: form.role,
          isActive: form.isActive,
          createdAt: new Date().toISOString()
        });
        toast.success("User account created successfully");
      }
      onSuccess();
    } catch (err) {
      console.error("Firebase Auth Error Details:", err.code, err.message);
      
      // 🌟 Halkan waxaan ku sifeeyay khaladaadka si loogu soo bandhigo Shadcn Alert component-kaaga
      switch (err.code) {
        case "auth/email-already-in-use":
          setError("Email-kan horey ayaa loogu sameeyay akoon kale!");
          break;
        case "auth/invalid-email":
          setError("Email-ka shaqaalahan ma ahan mid sax ah (Invalid Email format)!");
          break;
        case "auth/operation-not-allowed":
          setError("Cillad Firebase: Email/Password Authentication kalama soo shidin Firebase Console-kaaga.");
          break;
        case "auth/weak-password":
          setError("Password-ka aad dooratay waa mid daciif ah! (Ugu yaraan 6 xaraf ka dhig).");
          break;
        default:
          setError(`Nidaamka waa uu diiday inuu abuuro user: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-slate-900 dark:text-slate-100">
      
      {/* 🌟 SHADCN ALERT: Wuxuu soo baxayaa oo kaliya marka uu error jiro (Sida ku xusan Screenshot 2026-06-22 064447_2.png) */}
      {error && (
        <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-bold">Error Occurred</AlertTitle>
          <AlertDescription className="text-xs font-medium">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-1">
        <Label>Select Employee</Label>
        <Select value={form.employeeId} onValueChange={handleEmployeeChange} disabled={!!editData}>
          <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <SelectValue placeholder={editData ? "Employee locked" : "Dooro Shaqaalaha"} />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            {availableEmployees.length === 0 ? (
              <div className="p-2 text-xs text-center text-slate-500">Dhamaan shaqaalaha akoonno waa u furan yihiin</div>
            ) : (
              availableEmployees.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label>Email</Label>
        <Input value={form.email} readOnly className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700" />
      </div>

      {!editData && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Password</Label>
            <Input type="password" placeholder="Password" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" onChange={(e) => setForm({...form, password: e.target.value})} required />
          </div>
          <div className="space-y-1">
            <Label>Confirm</Label>
            <Input type="password" placeholder="Confirm" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" onChange={(e) => setForm({...form, confirmPassword: e.target.value})} required />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 items-center">
        <div className="space-y-1">
          <Label>Role</Label>
          <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
            <SelectTrigger className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              {["Admin", "HR", "Finance", "Manager"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 pt-5">
          <input 
            type="checkbox" 
            id="status"
            checked={form.isActive} 
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="w-4 h-4 accent-[#1e3a8a] dark:accent-blue-500 cursor-pointer"
          />
          <Label htmlFor="status" className="cursor-pointer font-medium select-none text-slate-700 dark:text-slate-300">
            {form.isActive ? "Active Account" : "Inactive Account"}
          </Label>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full bg-[#1e3a8a] text-white hover:bg-[#1a3378] dark:bg-blue-600 dark:hover:bg-blue-700">
        {isLoading ? <Loader2 className="animate-spin" /> : "Save Account"}
      </Button>
    </form>
  );
}