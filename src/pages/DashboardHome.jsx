import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, HandHeart, Building2 } from "lucide-react";

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DashboardHome() {
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const usersSnap = await getDocs(collection(db, "users"));
      const empSnap = await getDocs(collection(db, "employees"));

      setUsersCount(usersSnap.size); // or empSnap.size if you want employees
      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold">ERP Dashboard</h1>
        <p className="text-gray-500">
          Welcome to your NGO Management System
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Users</CardTitle>
            <Users size={18} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {loading ? "..." : usersCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Donations</CardTitle>
            <DollarSign size={18} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Beneficiaries</CardTitle>
            <HandHeart size={18} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Projects</CardTitle>
            <Building2 size={18} />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
          </CardContent>
        </Card>

      </div>

      {/* STATUS */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-600 font-medium">
            ✔ ERP System is running successfully
          </p>
        </CardContent>
      </Card>

    </div>
  );
}