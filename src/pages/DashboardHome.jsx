import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Users,
  DollarSign,
  HandHeart,
  Building2,
} from "lucide-react";

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

// 👉 IMPORT YOUR LOGO
import logo from "@/assets/logo.jpeg";

export default function DashboardHome() {
  const [employeesCount, setEmployeesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const empSnap = await getDocs(collection(db, "employees"));

      setEmployeesCount(empSnap.size);

      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">

        <div className="flex items-center gap-4">

          {/* LOGO */}
          <img
            src={logo}
            alt="AIF Logo"
            className="w-20 h-20 object-contain"
          />

          {/* TEXT */}
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
              Africa Ihsan Aid Foundation
            </h1>

            {/* ARABIC */}
            <p className="text-green-600 dark:text-green-400 text-lg font-semibold mt-1">
              مؤسسة إحسان للإغاثة والتنمية
            </p>

            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Welcome to your NGO ERP Management System
            </p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* EMPLOYEES */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-green-500 to-green-600 text-white">

          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Employees
            </CardTitle>

            <Users size={20} />
          </CardHeader>

          <CardContent>
            <p className="text-3xl font-bold">
              {loading ? "..." : employeesCount}
            </p>
          </CardContent>
        </Card>

        {/* DONATIONS */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-blue-500 to-blue-600 text-white">

          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Donations
            </CardTitle>

            <DollarSign size={20} />
          </CardHeader>

          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>

        {/* BENEFICIARIES */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">

          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Beneficiaries
            </CardTitle>

            <HandHeart size={20} />
          </CardHeader>

          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>

        {/* PROJECTS */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">

          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Projects
            </CardTitle>

            <Building2 size={20} />
          </CardHeader>

          <CardContent>
            <p className="text-3xl font-bold">0</p>
          </CardContent>
        </Card>
      </div>

      {/* SYSTEM STATUS */}
      <Card className="border-0 shadow-sm bg-white dark:bg-slate-900">

        <CardHeader>
          <CardTitle className="text-slate-800 dark:text-white">
            System Status
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>

            <p className="text-green-600 dark:text-green-400 font-medium">
              ERP System is running successfully
            </p>
          </div>
        </CardContent>
      </Card>

      {/* QUICK INFO */}
      <div className="grid md:grid-cols-2 gap-5">

        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">

          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-white">
              Organization Vision
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="text-slate-600 dark:text-slate-300 leading-7">
              Africa Ihsan Aid Foundation works to support humanitarian
              development, education, healthcare, and emergency response
              programs across communities.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">

          <CardHeader>
            <CardTitle className="text-slate-800 dark:text-white">
              Active Theme
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex gap-3">

              <div className="w-12 h-12 rounded-xl bg-blue-500"></div>

              <div className="w-12 h-12 rounded-xl bg-green-500"></div>

              <div className="w-12 h-12 rounded-xl bg-slate-900"></div>

            </div>

            <p className="mt-4 text-slate-600 dark:text-slate-300">
              Dashboard colors follow the official NGO brand identity.
            </p>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}