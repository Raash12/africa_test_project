import React, { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react"; // Shadcn badhanka loading-ka ah

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Halkan waxaa toos looga hubinayaa Firebase Console Users
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Si guul leh ayaad u soo gashay!");
    } catch (error) {
      console.error("Login Error:", error.code);
      
      // Farriimo kooban oo khaladka sharaxaya
      if (error.code === 'auth/invalid-credential') {
        toast.error("Email ama Password-ka waa khalad!");
      } else if (error.code === 'auth/too-many-requests') {
        toast.error("Isku dayo badan! In yar sug.");
      } else {
        toast.error("Khalad ayaa dhacay. Isku day mar kale.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-sm border-t-4 border-blue-600 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Soo gal</CardTitle>
          <CardDescription className="text-center">
            Gali xogtaada si aad u gasho Dashboard-ka.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@africa.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                disabled={isLoading}
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                disabled={isLoading}
                required 
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Hubinta xogta...
                </>
              ) : (
                "Gudaha u gal"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}