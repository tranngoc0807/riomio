"use client";

import { CompanyConfigProvider } from "@/context/CompanyConfigContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { RolePermissionsProvider } from "@/context/RolePermissionsContext";
import { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { Loader2 } from "lucide-react";

// Component to show signing out overlay - must be inside AuthProvider
function SigningOutOverlay() {
  const { signingOut } = useAuth();

  if (!signingOut) return null;

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center">
      <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
      <p className="text-gray-600 font-medium">Đang đăng xuất...</p>
    </div>
  );
}

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SigningOutOverlay />
      <RolePermissionsProvider>
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
      </RolePermissionsProvider>
    </AuthProvider>
  );
}
