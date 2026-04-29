import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppShell from "./components/AppShell";
import Dashboard from "./pages/Dashboard";
import EssayBuilder from "./pages/EssayBuilder";
import ParagraphEnginePage from "./pages/ParagraphEnginePage";
import TimedPractice from "./pages/TimedPractice";
import RetrievalToolkit from "./pages/RetrievalToolkit";
import Library from "./pages/Library";
import LibraryQuotes from "./pages/library/Quotes";
import LibraryQuestions from "./pages/library/Questions";
import LibraryThesisParagraph from "./pages/library/ThesisParagraph";
import LibraryComparison from "./pages/library/Comparison";
import LibraryContext from "./pages/library/Context";
import LibraryGlossary from "./pages/library/Glossary";
import LibraryParagraphStems from "./pages/library/ParagraphStems";
import Learn from "./pages/Learn";
import Modules from "./pages/Modules";
import LessonDetail from "./pages/LessonDetail";
import Practise from "./pages/Practise";
import Revise from "./pages/Revise";
import Compare from "./pages/Compare";
import NotFound from "./pages/NotFound.tsx";
import AuthPage from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import DataManager from "./pages/DataManager";
import RetrievalDrill from "./pages/RetrievalDrill";
import TextArchitecture from "./pages/TextArchitecture";
import ComparisonRoutes from "./pages/ComparisonRoutes";
import InterpretiveFlex from "./pages/InterpretiveFlex";
import TimedWrite from "./pages/TimedWrite";
import ParagraphBuilderPage from "./pages/ParagraphBuilderPage";
import { ContentProvider } from "./lib/ContentProvider";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { GradeBModeProvider } from "./contexts/GradeBModeContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ContentProvider>
        <GradeBModeProvider>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login" element={<Navigate to="/auth" replace />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Navigate to="/" replace />} />
                  <Route path="/build" element={<Navigate to="/builder" replace />} />
                  <Route path="/builder" element={<EssayBuilder />} />
                  <Route path="/paragraph-builder" element={<ParagraphBuilderPage />} />
                  <Route path="/paragraph-engine" element={<ParagraphEnginePage />} />
                  <Route path="/timed" element={<TimedPractice />} />
                  <Route path="/toolkit" element={<RetrievalToolkit />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/library/quotes" element={<LibraryQuotes />} />
                  <Route path="/library/questions" element={<LibraryQuestions />} />
                  <Route path="/library/thesis" element={<LibraryThesisParagraph />} />
                  <Route path="/library/comparison" element={<LibraryComparison />} />
                  <Route path="/library/context" element={<LibraryContext />} />
                  <Route path="/library/glossary" element={<LibraryGlossary />} />
                  <Route path="/library/stems" element={<LibraryParagraphStems />} />
                  <Route path="/drill" element={<RetrievalDrill />} />
                  <Route path="/architecture" element={<TextArchitecture />} />
                  <Route path="/routes" element={<ComparisonRoutes />} />
                  <Route path="/flex" element={<InterpretiveFlex />} />
                  <Route path="/session" element={<TimedWrite />} />
                  <Route path="/learn" element={<Learn />} />
                  <Route path="/modules" element={<Modules />} />
                  <Route path="/modules/:moduleSlug/:lessonSlug" element={<LessonDetail />} />
                  <Route path="/practise" element={<Practise />} />
                  <Route path="/revise" element={<Revise />} />
                  <Route path="/compare" element={<Compare />} />
                  <Route path="/admin" element={<ProtectedRoute requireAdmin><DataManager /></ProtectedRoute>} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </GradeBModeProvider>
      </ContentProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
