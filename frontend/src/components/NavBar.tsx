import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useState, useRef, useEffect } from 'react'
import { useEffectiveModulesStore } from '@/stores/effective-modules.store'

export function NavBar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [adminOpen, setAdminOpen] = useState(false)
  const adminRef = useRef<HTMLDivElement>(null)
  const [skillsOpen, setSkillsOpen] = useState(false)
  const skillsRef = useRef<HTMLDivElement>(null)
  const [logoutHover, setLogoutHover] = useState(false)
  const [capacityOpen, setCapacityOpen] = useState(false)
  const capacityRef = useRef<HTMLDivElement>(null)

  const { fetchModules, clearModules, isModuleAccessible, loaded } = useEffectiveModulesStore()

  // Fetch effective modules when user is authenticated
  useEffect(() => {
    if (isAuthenticated && !loaded) {
      fetchModules()
    }
  }, [isAuthenticated, loaded, fetchModules])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!adminRef.current) return
      if (!adminRef.current.contains(e.target as Node)) setAdminOpen(false)
      if (skillsRef.current && !skillsRef.current.contains(e.target as Node)) setSkillsOpen(false)
      if (capacityRef.current && !capacityRef.current.contains(e.target as Node)) setCapacityOpen(false)
    }
    document.addEventListener('click', onDocClick)
    return () => document.removeEventListener('click', onDocClick)
  }, [])

  const onLogout = async () => {
    await logout()
    clearModules()
    navigate('/login')
  }

  // Helper to check module access (admins always have access, otherwise check store)
  const hasModuleAccess = (moduleId: string) => {
    if (user?.isAdmin) return true
    return isModuleAccessible(moduleId)
  }

  return (
    <nav className="flex items-center gap-3 text-sm">
      {!isAuthenticated && (
        <Link to="/login" className="px-3 py-2 rounded-md text-off_white/90 hover:text-white hover:bg-white/10 transition">Login</Link>
      )}
      {isAuthenticated && (
        <>
          {/* Admin Dropdown */}
          {user?.isAdmin && (
            <div className="relative" ref={adminRef}>
              <button
                className={`px-3 py-2 rounded-md text-off_white/90 hover:text-white hover:bg-white/10 inline-flex items-center gap-1 border-b-2 ${adminOpen ? 'border-white/90 text-white' : 'border-transparent hover:border-white/60'} transition`}
                onClick={() => setAdminOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={adminOpen}
              >
                <span>Admin</span>
                <svg className={`h-3 w-3 motion-safe:transition-transform ${adminOpen ? 'rotate-180' : ''} motion-reduce:transform-none`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5.23 7.21a.75.75 0 011.06.02L10 10.586l3.71-3.355a.75.75 0 111.02 1.1l-4.22 3.815a.75.75 0 01-1.02 0L5.21 8.33a.75.75 0 01.02-1.12z"/></svg>
              </button>
              {adminOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white text-primary_dark rounded-lg shadow-xl ring-1 ring-black/5 z-50 py-2" role="menu">
                  <Link className="block px-4 py-2 hover:bg-gray-50" to="/admin/skills" onClick={() => setAdminOpen(false)} role="menuitem">Skills verwalten</Link>
                  <Link className="block px-4 py-2 hover:bg-gray-50" to="/admin/employees" onClick={() => setAdminOpen(false)} role="menuitem">Mitarbeiter verwalten</Link>
                  <Link className="block px-4 py-2 hover:bg-gray-50" to="/admin/teams" onClick={() => setAdminOpen(false)} role="menuitem">Teams verwalten</Link>
                  <Link className="block px-4 py-2 hover:bg-gray-50" to="/admin/strategic-goals" onClick={() => setAdminOpen(false)} role="menuitem">Strategische Ziele</Link>
                  <Link className="block px-4 py-2 hover:bg-gray-50" to="/admin/reference-projects" onClick={() => setAdminOpen(false)} role="menuitem">Referenzen (Admin)</Link>
                  <Link className="block px-4 py-2 hover:bg-gray-50" to="/admin/capacities" onClick={() => setAdminOpen(false)} role="menuitem">Kapazitäten (Admin)</Link>
                  <Link className="block px-4 py-2 hover:bg-gray-50" to="/admin/modules" onClick={() => setAdminOpen(false)} role="menuitem">Module konfigurieren</Link>
                  <Link className="block px-4 py-2 hover:bg-gray-50" to="/admin/db" onClick={() => setAdminOpen(false)} role="menuitem">Datenbank (Admin)</Link>
                </div>
              )}
            </div>
          )}

          {/* Skills dropdown - only show if skills module is accessible */}
          {hasModuleAccess('skills') && (
            <div className="relative" ref={skillsRef}>
              <button
                className={`px-3 py-2 rounded-md text-off_white/90 hover:text-white hover:bg-white/10 inline-flex items-center gap-1 border-b-2 ${skillsOpen ? 'border-white/90 text-white' : 'border-transparent hover:border-white/60'} transition`}
                onClick={() => setSkillsOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={skillsOpen}
              >
                <span>Meine Skills</span>
                <svg className={`h-3 w-3 motion-safe:transition-transform ${skillsOpen ? 'rotate-180' : ''} motion-reduce:transform-none`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5.23 7.21a.75.75 0 011.06.02L10 10.586l3.71-3.355a.75.75 0 111.02 1.1l-4.22 3.815a.75.75 0 01-1.02 0L5.21 8.33a.75.75 0 01.02-1.12z"/></svg>
              </button>
              {skillsOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white text-primary_dark rounded-lg shadow-xl ring-1 ring-black/5 z-50 py-2" role="menu">
                  <Link className="block px-4 py-2 hover:bg-gray-50" to="/my-skills?mode=form" onClick={() => setSkillsOpen(false)} role="menuitem">Selbsteinschätzung</Link>
                  <Link className="block px-4 py-2 hover:bg-gray-50" to="/my-skills?mode=history" onClick={() => setSkillsOpen(false)} role="menuitem">Historie</Link>
                  {hasModuleAccess('assessments') && (
                    <Link className="block px-4 py-2 hover:bg-gray-50" to="/assess" onClick={() => setSkillsOpen(false)} role="menuitem">Bewerten</Link>
                  )}
                  <Link className="block px-4 py-2 hover:bg-gray-50" to="/matrix" onClick={() => setSkillsOpen(false)} role="menuitem">Matrix</Link>
                </div>
              )}
            </div>
          )}
          {/* Kurzprofil link - only show if kurzprofil module is accessible */}
          {hasModuleAccess('kurzprofil') && (
            <NavLink
              to="/kurzprofil"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md border-b-2 transition ${isActive ? 'text-white bg-white/10 border-white/90' : 'text-off_white/90 hover:text-white hover:bg-white/10 border-transparent hover:border-white/60'}`
              }
            >
              Kurzprofil
            </NavLink>
          )}

          {/* Referenz Projekte link - only show if reference-projects module is accessible */}
          {hasModuleAccess('reference-projects') && (
            <NavLink
              to="/referenz-projekte"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md border-b-2 transition ${isActive ? 'text-white bg-white/10 border-white/90' : 'text-off_white/90 hover:text-white hover:bg-white/10 border-transparent hover:border-white/60'}`
              }
            >
              Referenz Projekte
            </NavLink>
          )}

          {/* Strategic Goals link - only show if strategic-goals module is accessible */}
          {hasModuleAccess('strategic-goals') && (
            <NavLink
              to="/strategic-goals"
              className={({ isActive }) =>
                `px-3 py-2 rounded-md border-b-2 transition ${isActive ? 'text-white bg-white/10 border-white/90' : 'text-off_white/90 hover:text-white hover:bg-white/10 border-transparent hover:border-white/60'}`
              }
            >
              Strategische Ziele
            </NavLink>
          )}
          {/* Capacity Dropdown - only show if capacities module is accessible */}
          {hasModuleAccess('capacities') && (
            <div className="relative" ref={capacityRef}>
              <button
                className={`px-3 py-2 rounded-md text-off_white/90 hover:text-white hover:bg-white/10 inline-flex items-center gap-1 border-b-2 ${capacityOpen ? 'border-white/90 text-white' : 'border-transparent hover:border-white/60'} transition`}
                onClick={() => setCapacityOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={capacityOpen}
              >
                <span>Kapazität</span>
                <svg className={`h-3 w-3 motion-safe:transition-transform ${capacityOpen ? 'rotate-180' : ''} motion-reduce:transform-none`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5.23 7.21a.75.75 0 011.06.02L10 10.586l3.71-3.355a.75.75 0 111.02 1.1l-4.22 3.815a.75.75 0 01-1.02 0L5.21 8.33a.75.75 0 01.02-1.12z"/></svg>
              </button>
              {capacityOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white text-primary_dark rounded-lg shadow-xl ring-1 ring-black/5 z-50 py-2" role="menu">
                  <Link className="block px-4 py-2 hover:bg-gray-50" to="/my-capacity" onClick={() => setCapacityOpen(false)} role="menuitem">Kapazität</Link>
                  <Link className="block px-4 py-2 hover:bg-gray-50" to="/capacities-overview" onClick={() => setCapacityOpen(false)} role="menuitem">Übersicht</Link>
                </div>
              )}
            </div>
          )}
        </>
      )}
      {isAuthenticated && (
        <div className="flex items-center gap-3">
          <NavLink
            to="/"
            end
            aria-label="Home"
            className={({ isActive }) =>
              `px-2 py-2 rounded-md inline-flex items-center border-b-2 transition ${isActive ? 'text-white bg-white/10 border-white/90' : 'text-off_white/90 hover:text-white hover:bg-white/10 border-transparent hover:border-white/60'}`
            }
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 3.172 3 10v10a1 1 0 0 0 1 1h6v-6h4v6h6a1 1 0 0 0 1-1V10l-9-6.828Z" />
            </svg>
          </NavLink>
          <span className="inline-flex items-center gap-2">
            <svg className="h-4 w-4 text-off_white/90" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 12a5 5 0 100-10 5 5 0 000 10zM3 20a7 7 0 1114 0H3z" />
            </svg>
            <span className="text-sm text-off_white/90">{user?.firstName} {user?.lastName}</span>
          </span>
          <button
            onClick={onLogout}
            onMouseEnter={() => setLogoutHover(true)}
            onMouseLeave={() => setLogoutHover(false)}
            className="px-3 py-2 rounded-md text-white shadow focus:outline-none focus:ring-2 focus:ring-white/60"
            style={{ backgroundColor: logoutHover ? '#0A1B85' : '#000F61' }}
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}
