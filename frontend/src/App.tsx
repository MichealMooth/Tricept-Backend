import { Link, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import SkillManagementPage from './pages/admin/SkillManagementPage';
import LoginPage from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import MySkillsPage from './pages/MySkillsPage';
import EmployeeProfilePage from './pages/EmployeeProfilePage';
import MatrixPage from './pages/MatrixPage';
import AssessEmployeePage from './pages/AssessEmployeePage';
import EmployeesPage from './pages/admin/EmployeesPage';
import { NavBar } from './components/NavBar';
import MyCapacityPage from './pages/MyCapacityPage';
import CapacityAdminPage from './pages/admin/CapacityAdminPage';
import CapacityOverviewPage from './pages/CapacityOverviewPage';
import StrategicGoalsPage from './pages/StrategicGoalsPage';
import StrategicGoalsAdminPage from './pages/admin/StrategicGoalsAdminPage';
import DatabaseBrowserPage from './pages/admin/DatabaseBrowserPage';
import KurzprofilPage from './pages/KurzprofilPage';
import ReferenzProjektePage from './pages/ReferenzProjektePage';
import ReferenceProjectsAdminPage from './pages/admin/ReferenceProjectsAdminPage';

function App() {
  return (
    <div className="min-h-screen text-primary_dark">
      <header className="bg-primary-gradient text-off_white shadow-soft sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:backdrop-blur border-b border-white/10">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 focus:outline-none">
            <img
              src={(import.meta as any).env?.VITE_LOGO_URL || '/logo.png'}
              alt="Tricept Consulting"
              className="h-8 w-auto object-contain block"
              loading="eager"
              decoding="async"
            />
            <span className="sr-only">Tricept Consulting</span>
          </Link>
          <NavBar />
        </div>
      </header>
      <main className="container mx-auto px-6 py-10">
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/admin/skills"
            element={
              <AdminRoute>
                <SkillManagementPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/employees"
            element={
              <AdminRoute>
                <EmployeesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/capacities"
            element={
              <AdminRoute>
                <CapacityAdminPage />
              </AdminRoute>
            }
          />
          <Route
            path="/employees/:employeeId"
            element={
              <ProtectedRoute>
                <EmployeeProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/matrix"
            element={
              <ProtectedRoute>
                <MatrixPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/assess"
            element={
              <ProtectedRoute>
                <AssessEmployeePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-skills"
            element={
              <ProtectedRoute>
                <MySkillsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-capacity"
            element={
              <ProtectedRoute>
                <MyCapacityPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/capacities-overview"
            element={
              <ProtectedRoute>
                <CapacityOverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/strategic-goals"
            element={
              <ProtectedRoute>
                <StrategicGoalsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kurzprofil"
            element={
              <ProtectedRoute>
                <KurzprofilPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/referenz-projekte"
            element={
              <ProtectedRoute>
                <ReferenzProjektePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/strategic-goals"
            element={
              <AdminRoute>
                <StrategicGoalsAdminPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/reference-projects"
            element={
              <AdminRoute>
                <ReferenceProjectsAdminPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/db"
            element={
              <AdminRoute>
                <DatabaseBrowserPage />
              </AdminRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
