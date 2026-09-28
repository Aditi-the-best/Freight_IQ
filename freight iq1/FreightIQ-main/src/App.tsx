import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import PortIntelligence from "./pages/PortIntelligence";
import FreightForecastPage from "./pages/FreightForecastPage";
import MarketEntryPage from "./pages/MarketEntryPage";
import VesselOptimizerPage from "./pages/VesselOptimizerPage";
import IdleAnalysisPage from "./pages/IdleAnalysisPage";
import RiskMonitorPage from "./pages/RiskMonitorPage";
import AnalysisHistoryPage from "./pages/AnalysisHistoryPage";
import DataUploadPage from "./pages/DataUploadPage";
import { type ReactNode } from "react";

function Protected({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <Protected>
            <DashboardLayout />
          </Protected>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="port/:portId" element={<PortIntelligence />} />
        <Route path="freight-forecast" element={<FreightForecastPage />} />
        <Route path="market-entry" element={<MarketEntryPage />} />
        <Route path="vessel-optimizer" element={<VesselOptimizerPage />} />
        <Route path="idle-analysis" element={<IdleAnalysisPage />} />
        <Route path="risk-monitor" element={<RiskMonitorPage />} />
        <Route path="analysis-history" element={<AnalysisHistoryPage />} />
        <Route path="data-upload" element={<DataUploadPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
