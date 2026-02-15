import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { RESEARCH_SURVEY_CONFIG } from "./config/researchSurveyConfig";
import { useCanvasStore } from "./store/useCanvasStore";

const LandingPage = lazy(() =>
  import("./pages/LandingPage").then((module) => ({ default: module.LandingPage }))
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage }))
);
const CanvasPage = lazy(() =>
  import("./pages/CanvasPage").then((module) => ({ default: module.CanvasPage }))
);
const NewCanvasPage = lazy(() =>
  import("./pages/NewCanvasPage").then((module) => ({ default: module.NewCanvasPage }))
);
const AccountPage = lazy(() =>
  import("./pages/AccountPage").then((module) => ({ default: module.AccountPage }))
);
const ResearchSurveyPage = lazy(() =>
  import("./pages/ResearchSurveyPage").then((module) => ({ default: module.ResearchSurveyPage }))
);
const ResearchConsentPage = lazy(() =>
  import("./pages/ResearchConsentPage").then((module) => ({ default: module.ResearchConsentPage }))
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((module) => ({ default: module.LoginPage }))
);
const SignupPage = lazy(() =>
  import("./pages/SignupPage").then((module) => ({ default: module.SignupPage }))
);

function App() {
  const darkMode = useCanvasStore((state) => state.darkMode);
  const surveyEnabled = RESEARCH_SURVEY_CONFIG.enabled;

  return (
    <div className={darkMode ? "dark" : ""}>
      <Suspense fallback={<RouteLoadingFallback />}>
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
                {surveyEnabled ? <ResearchSurveyPage /> : <Navigate replace to="/canvas" />}
              </ProtectedRoute>
            }
            path="/survey"
          />
          <Route
            element={
              <ProtectedRoute>
                {surveyEnabled ? <ResearchConsentPage /> : <Navigate replace to="/canvas" />}
              </ProtectedRoute>
            }
            path="/survey/consent"
          />

          <Route element={<LoginPage />} path="/auth/login" />
          <Route element={<SignupPage />} path="/auth/signup" />

          <Route element={<Navigate replace to="/" />} path="*" />
        </Routes>
      </Suspense>
    </div>
  );
}

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light dark:bg-background-dark">
      <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
        Carregando...
      </p>
    </div>
  );
}

export default App;
