"use client";

import { CompanyConfigProvider } from "@/context/CompanyConfigContext";
import { AuthProvider } from "@/context/AuthContext";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CompanyConfigProvider>
        {children}
      </CompanyConfigProvider>
    </AuthProvider>
  );
}
