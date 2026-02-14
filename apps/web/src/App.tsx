import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AccountPage } from "./pages/AccountPage";
import { CanvasPage } from "./pages/CanvasPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { NewCanvasPage } from "./pages/NewCanvasPage";
import { ResearchConsentPage } from "./pages/ResearchConsentPage";
import { ResearchSurveyPage } from "./pages/ResearchSurveyPage";
import { SignupPage } from "./pages/SignupPage";
import { useCanvasStore } from "./store/useCanvasStore";

function App() {
  const darkMode = useCanvasStore((state) => state.darkMode);

  return (
    <div className={darkMode ? "dark" : ""}>
      <Routes>
        <Route element={<LandingPage />} path="/" />

        <Route
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
          path="/dashboard"
        />
        <Route
          element={
            <ProtectedRoute>
              <CanvasPage />
            </ProtectedRoute>
          }
          path="/canvas"
        />
        <Route
          element={
            <ProtectedRoute>
              <NewCanvasPage />
            </ProtectedRoute>
          }
          path="/canvas/new"
        />
        <Route
          element={
            <ProtectedRoute>
              <AccountPage />
            </ProtectedRoute>
          }
          path="/account"
        />
        <Route
          element={
            <ProtectedRoute>
              <ResearchSurveyPage />
            </ProtectedRoute>
          }
          path="/survey"
        />
        <Route
          element={
            <ProtectedRoute>
              <ResearchConsentPage />
            </ProtectedRoute>
          }
          path="/survey/consent"
        />

        <Route element={<LoginPage />} path="/auth/login" />
        <Route element={<SignupPage />} path="/auth/signup" />

        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </div>
  );
}

export default App;
