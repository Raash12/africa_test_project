import React, { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { toast } from "sonner";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"; // Xogta guusha iyo guuldarrada

import Logo from "@/assets/logo.jpeg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // 🔐 Status states si loogu muujiyo Alert Callout qaabka Base UI
  const [status, setStatus] = useState({ type: null, message: "" });
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);

  // Saacad u countdown-garaysa haddii nidaamka la qufuko (Brute-Force Protection)
  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setTimeout(() => setLockoutTime(lockoutTime - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutTime]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setStatus({ type: null, message: "" });

    // Amniga: Hubi haddii isticmaalaha laga xiray nidaamka isku dayo badan awgood
    if (lockoutTime > 0) {
      const errMsg = `Too many failed attempts. Try again in ${lockoutTime} seconds.`;
      setStatus({ type: "error", message: errMsg });
      toast.error(errMsg);
      return;
    }

    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      
      setStatus({ type: "success", message: "Login successful! Redirecting to dashboard..." });
      toast.success("Login successful!");
      setFailedAttempts(0); 
    } catch (error) {
      console.log(error);
      const currentAttempts = failedAttempts + 1;
      setFailedAttempts(currentAttempts);

      let friendlyMessage = "Login failed. Please check your network connection.";

      // Amniga: Baaritaan hufan oo laga rabo credential-ka khaldan
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        friendlyMessage = "Invalid email or password.";
      } else if (error.code === "auth/too-many-requests") {
        friendlyMessage = "Access temporarily blocked due to unusual activity. Try again later.";
      }

      // Haddii uu 3 jeer ka badan ku celiyo, quful 30 sekan ah saar (Brute Force Security)
      if (currentAttempts >= 3) {
        setLockoutTime(30);
        friendlyMessage = "Too many invalid attempts. Account login locked for 30 seconds.";
      }

      setStatus({ type: "error", message: friendlyMessage });
      toast.error(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-sm shadow-xl border-t-8 border-t-[#1e3a8a] rounded-xl bg-white">
        
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-3">
            <img
              src={Logo}
              alt="NGO ERP Logo"
              className="h-16 w-16 object-cover rounded-full border border-slate-200 shadow-sm"
            />
          </div>

          <CardTitle className="text-2xl font-bold text-slate-900 uppercase tracking-tight">
            Africa Ihsan Aid
          </CardTitle>

          <CardDescription className="text-xs text-slate-500">
            Enter your credentials to manage project financials
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            
            {/* 🛠️ ALERT CALLOUTS (Maching-garaynaya Base UI Alert Callout) */}
            {status.type === "success" && (
              <div className="flex items-start gap-3 p-3 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg animate-fade-in">
                <CheckCircle2 size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold block">Access Granted</span>
                  {status.message}
                </div>
              </div>
            )}

            {status.type === "error" && (
              <div className="flex items-start gap-3 p-3 text-xs bg-red-50 border border-red-200 text-red-800 rounded-lg animate-fade-in">
                <AlertCircle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold block">Security Alert</span>
                  {status.message}
                </div>
              </div>
            )}

            {/* EMAIL INPUT */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
              <Input
                type="email"
                placeholder="admin@ngo.com"
                className="h-9 text-xs border-slate-200 focus:border-[#1e3a8a] focus:ring-[#1e3a8a] rounded-lg shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || lockoutTime > 0}
                autoComplete="email"
                required
              />
            </div>

            {/* PASSWORD INPUT */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                className="h-9 text-xs border-slate-200 focus:border-[#1e3a8a] focus:ring-[#1e3a8a] rounded-lg shadow-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || lockoutTime > 0}
                autoComplete="current-password"
                required
              />
            </div>

          </CardContent>

          <CardFooter className="pt-2">
            <Button
              type="submit"
              className="w-full h-9 bg-[#1e3a8a] hover:bg-[#152a61] text-white font-medium text-xs rounded-lg transition-all shadow-md active:scale-[0.99] disabled:opacity-50"
              disabled={isLoading || lockoutTime > 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                  Authenticating...
                </>
              ) : lockoutTime > 0 ? (
                `Locked (${lockoutTime}s)`
              ) : (
                "Secure Login"
              )}
            </Button>
          </CardFooter>
        </form>

      </Card>
    </div>
  );
}