import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Orders from "@/pages/Orders";
import Customers from "@/pages/Customers";
import Packages from "@/pages/Packages";
import WebhookLogs from "@/pages/WebhookLogs";
import Settings from "@/pages/Settings";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-shqiponja border-t-transparent" /></div>;
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="customers" element={<Customers />} />
        <Route path="packages" element={<Packages />} />
        <Route path="webhooks" element={<WebhookLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
