"use client";

import { CompanyConfigProvider } from "@/context/CompanyConfigContext";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <CompanyConfigProvider>
      {children}
    </CompanyConfigProvider>
  );
}
