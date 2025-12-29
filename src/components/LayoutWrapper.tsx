"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "./Sidebar";
import { useAuth } from "@/context/AuthContext";

const authRoutes = ["/login", "/register"];

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, initialized } = useAuth();
  const isAuthPage = authRoutes.includes(pathname);

  useEffect(() => {
    if (!initialized) return;

    // Has session on auth page - redirect to home
    if (session && isAuthPage) {
      router.replace("/");
      return;
    }

    // No session on protected page - redirect to login
    // if (!session && !isAuthPage) {
    //   router.replace("/login");
    //   return;
    // }
  }, [initialized, session, isAuthPage, pathname, router]);

  // Show loading while initializing
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Auth pages layout
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
        {children}
      </div>
    );
  }

  // Dashboard layout with sidebar
  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar />
      <main className="lg:ml-64 min-h-screen overflow-auto">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
