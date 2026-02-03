"use client";

import { CompanyConfigProvider } from "@/context/CompanyConfigContext";
import { AuthProvider } from "@/context/AuthContext";
import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <CompanyConfigProvider>
        {children}
        <Toaster
          position="top-right"
          containerStyle={{ zIndex: 99999 }}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '14px',
            },
            success: {
              style: {
                background: '#22c55e',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#22c55e',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#ef4444',
              },
            },
          }}
        />
      </CompanyConfigProvider>
    </AuthProvider>
  );
}
