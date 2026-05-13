import React from "react";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function Dashboard({ user }) {
  const handleLogout = () => {
    auth.signOut();
    toast.info("Si guul leh ayaad uga baxday!");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 p-6">
      <Card className="w-full max-w-2xl shadow-xl border-t-4 border-blue-600">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold italic">Africa Ihsan Aid</CardTitle>
          <CardTitle className="text-xl">Dashboard-ka Maamulka</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 text-center">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-lg text-green-700 font-medium">
              Ku soo dhawaada, <strong>{user.email}</strong>!
            </p>
          </div>
          <p className="text-gray-600">
            Waxaad hadda ku jirtaa nidaamka maamulka mashruuca.
          </p>
          <Button variant="destructive" className="w-full sm:w-auto" onClick={handleLogout}>
            Ka bax (Logout)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}