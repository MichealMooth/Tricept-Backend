/**
 * Effective Modules Store
 *
 * Zustand store for managing user's effective module access.
 * Automatically fetches on auth state changes.
 *
 * Task Group 6.2: Create Zustand store for effective modules
 */

import { create } from 'zustand';
import {
  getEffectiveModules,
  EffectiveModulesSummary,
  UserEffectiveModule,
} from '@/services/effective-modules.service';

interface EffectiveModulesState {
  /** All modules with user's access status */
  modules: UserEffectiveModule[];

  /** Whether the store has been loaded */
  loaded: boolean;

  /** Loading state */
  loading: boolean;

  /** Error message if fetch failed */
  error: string | null;

  /** Fetch effective modules from API */
  fetchModules: () => Promise<void>;

  /** Clear the store (e.g., on logout) */
  clearModules: () => void;

  /** Check if a module is accessible by ID */
  isModuleAccessible: (moduleId: string) => boolean;

  /** Get a module by ID */
  getModule: (moduleId: string) => UserEffectiveModule | undefined;

  /** Get all accessible modules */
  getAccessibleModules: () => UserEffectiveModule[];
}

export const useEffectiveModulesStore = create<EffectiveModulesState>((set, get) => ({
  modules: [],
  loaded: false,
  loading: false,
  error: null,

  fetchModules: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getEffectiveModules();
      set({
        modules: data.modules,
        loaded: true,
        loading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch modules',
        loading: false,
      });
    }
  },

  clearModules: () => {
    set({
      modules: [],
      loaded: false,
      loading: false,
      error: null,
    });
  },

  isModuleAccessible: (moduleId: string) => {
    const module = get().modules.find((m) => m.module.id === moduleId);
    return module?.isAccessible ?? false;
  },

  getModule: (moduleId: string) => {
    return get().modules.find((m) => m.module.id === moduleId);
  },

  getAccessibleModules: () => {
    return get().modules.filter((m) => m.isAccessible);
  },
}));
