import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppShell from "./components/AppShell";
import Dashboard from "./pages/Dashboard";
import EssayBuilder from "./pages/EssayBuilder";
import TimedPractice from "./pages/TimedPractice";
import RetrievalToolkit from "./pages/RetrievalToolkit";
import NotFound from "./pages/NotFound.tsx";
import AuthPage from "./pages/Auth";
import DataManager from "./pages/DataManager";
import { ContentProvider } from "./lib/ContentProvider";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ContentProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route element={<AppShell />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/builder" element={<EssayBuilder />} />
                <Route path="/timed" element={<TimedPractice />} />
                <Route path="/toolkit" element={<RetrievalToolkit />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requireAdmin>
                      <DataManager />
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ContentProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
