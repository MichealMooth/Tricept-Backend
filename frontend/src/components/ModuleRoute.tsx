/**
 * Module Route Guard Component
 *
 * Route guard that checks if the current user has access to a specific module.
 * Redirects to dashboard if module is disabled.
 *
 * Task Group 6.4: Create module access route guard
 */

import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useEffectiveModulesStore } from '@/stores/effective-modules.store';
import { UserEffectiveModule } from '@/services/effective-modules.service';

interface ModuleRouteProps {
  /** Module ID to check access for */
  moduleId: string;

  /** Children to render if access is granted */
  children: ReactNode;

  /** Optional fallback while loading */
  loadingFallback?: ReactNode;
}

/**
 * Route guard that ensures user has access to a specific module.
 * If the module is disabled for the user, redirects to the dashboard.
 */
export function ModuleRoute({
  moduleId,
  children,
  loadingFallback = <div className="text-center py-8">Pruefe Zugriff...</div>,
}: ModuleRouteProps) {
  const { modules, loaded, loading, fetchModules, isModuleAccessible } =
    useEffectiveModulesStore();

  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Fetch modules if not loaded yet
    if (!loaded && !loading) {
      fetchModules();
    }
  }, [loaded, loading, fetchModules]);

  useEffect(() => {
    // Set checked once modules are loaded
    if (loaded) {
      setChecked(true);
    }
  }, [loaded]);

  // Show loading state while fetching
  if (loading || !checked) {
    return <>{loadingFallback}</>;
  }

  // Check module access
  const hasAccess = isModuleAccessible(moduleId);

  // Redirect if no access
  if (!hasAccess) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/**
 * Hook for checking module access in components.
 */
export function useModuleAccess(moduleId: string): {
  hasAccess: boolean;
  loading: boolean;
  module: UserEffectiveModule | undefined;
} {
  const { loaded, loading, fetchModules, getModule, isModuleAccessible } =
    useEffectiveModulesStore();

  useEffect(() => {
    if (!loaded && !loading) {
      fetchModules();
    }
  }, [loaded, loading, fetchModules]);

  return {
    hasAccess: isModuleAccessible(moduleId),
    loading: loading || !loaded,
    module: getModule(moduleId),
  };
}
