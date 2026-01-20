/**
 * Module Configuration Admin Page
 *
 * Displays all modules with their team configurations.
 * When moduleId parameter is present, shows detail view for that module.
 * Allows admins to navigate to team-specific configuration.
 *
 * Task Group 5.3: Create ModuleConfigPage
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  listModules,
  getModule,
  ModuleWithConfigs,
  TeamConfig,
  upsertConfig,
  DataScope,
} from '@/services/admin-module-config.service';

/**
 * Module list view component - shows all modules
 */
function ModuleListView({
  modules,
  loading,
  search,
  onSearchChange,
}: {
  modules: ModuleWithConfigs[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const filtered = modules.filter(
    (m) =>
      m.module.name.toLowerCase().includes(search.toLowerCase()) ||
      m.module.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="flex items-center gap-2">
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Module suchen..."
          className="w-64 rounded border px-3 py-2"
        />
      </div>

      {loading && <div className="text-sm text-gray-600">Lade...</div>}

      <div className="overflow-auto rounded border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-3 py-2">Modul</th>
              <th className="px-3 py-2">Beschreibung</th>
              <th className="px-3 py-2">Erlaubte Scopes</th>
              <th className="px-3 py-2">Standard-Scope</th>
              <th className="px-3 py-2">Teams aktiv</th>
              <th className="w-32 px-3 py-2">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => (
              <tr key={m.module.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">
                  {m.module.name}
                  {m.module.adminOnly && (
                    <span className="ml-2 rounded bg-indigo-100 px-2 py-0.5 text-[10px] text-indigo-700">
                      ADMIN
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-gray-600">{m.module.description || '—'}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    {m.module.allowedScopes.map((scope) => (
                      <span
                        key={scope}
                        className={`rounded px-2 py-0.5 text-[10px] ${
                          scope === 'GLOBAL'
                            ? 'bg-green-100 text-green-700'
                            : scope === 'TEAM'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {scope}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] ${
                      m.module.defaultScope === 'GLOBAL'
                        ? 'bg-green-100 text-green-700'
                        : m.module.defaultScope === 'TEAM'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {m.module.defaultScope}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="text-gray-700">
                    {m.enabledTeamCount} / {m.totalTeamCount}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <Link
                    to={`/admin/modules/${m.module.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Details
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                  Keine Module gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

/**
 * Module detail view component - shows team configs for a specific module
 */
function ModuleDetailView({
  moduleData,
  loading,
  onRefresh,
}: {
  moduleData: ModuleWithConfigs | null;
  loading: boolean;
  onRefresh: () => void;
}) {
  const [saving, setSaving] = useState<string | null>(null);
  const [teamSearch, setTeamSearch] = useState('');

  if (loading) {
    return <div className="text-sm text-gray-600">Lade...</div>;
  }

  if (!moduleData) {
    return <div className="text-sm text-red-600">Modul nicht gefunden</div>;
  }

  const filteredTeams = moduleData.teamConfigs.filter((t) =>
    t.teamName.toLowerCase().includes(teamSearch.toLowerCase())
  );

  const handleToggleEnabled = (config: TeamConfig) => {
    setSaving(config.teamGroupId);
    void upsertConfig({
      teamGroupId: config.teamGroupId,
      moduleId: moduleData.module.id,
      isEnabled: !config.isEnabled,
      scope: config.scope,
    })
      .then(() => {
        onRefresh();
      })
      .finally(() => {
        setSaving(null);
      });
  };

  const handleScopeChange = (config: TeamConfig, newScope: DataScope | null) => {
    setSaving(config.teamGroupId);
    void upsertConfig({
      teamGroupId: config.teamGroupId,
      moduleId: moduleData.module.id,
      isEnabled: config.isEnabled,
      scope: newScope,
    })
      .then(() => {
        onRefresh();
      })
      .finally(() => {
        setSaving(null);
      });
  };

  const getEffectiveScope = (config: TeamConfig): DataScope => {
    return config.scope || moduleData.module.defaultScope;
  };

  return (
    <>
      <div className="flex items-center gap-2 text-sm">
        <Link to="/admin/modules" className="text-blue-600 hover:underline">
          Modulkonfiguration
        </Link>
        <span className="text-gray-400">/</span>
        <span className="font-medium">{moduleData.module.name}</span>
      </div>

      <h1 className="text-2xl font-semibold">{moduleData.module.name}</h1>

      {moduleData.module.description && (
        <p className="text-sm text-gray-600">{moduleData.module.description}</p>
      )}

      <div className="rounded border bg-gray-50 p-4">
        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
          <div>
            <div className="text-gray-500">Modul-ID</div>
            <div className="font-mono">{moduleData.module.id}</div>
          </div>
          <div>
            <div className="text-gray-500">Route</div>
            <div className="font-mono">{moduleData.module.route}</div>
          </div>
          <div>
            <div className="text-gray-500">Erlaubte Scopes</div>
            <div className="mt-1 flex gap-1">
              {moduleData.module.allowedScopes.map((scope) => (
                <span
                  key={scope}
                  className={`rounded px-2 py-0.5 text-[10px] ${
                    scope === 'GLOBAL'
                      ? 'bg-green-100 text-green-700'
                      : scope === 'TEAM'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {scope}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-gray-500">Standard-Scope</div>
            <span
              className={`rounded px-2 py-0.5 text-[10px] ${
                moduleData.module.defaultScope === 'GLOBAL'
                  ? 'bg-green-100 text-green-700'
                  : moduleData.module.defaultScope === 'TEAM'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
              }`}
            >
              {moduleData.module.defaultScope}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Team-Konfigurationen</h2>
        <div className="text-sm text-gray-600">
          {moduleData.enabledTeamCount} von {moduleData.totalTeamCount} Teams aktiviert
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={teamSearch}
          onChange={(e) => setTeamSearch(e.target.value)}
          placeholder="Teams suchen..."
          className="w-64 rounded border px-3 py-2"
        />
      </div>

      <div className="overflow-auto rounded border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              <th className="px-3 py-2">Team</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Konfigurierter Scope</th>
              <th className="px-3 py-2">Effektiver Scope</th>
              <th className="w-48 px-3 py-2">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.map((config) => {
              const isSaving = saving === config.teamGroupId;
              const effectiveScope = getEffectiveScope(config);

              return (
                <tr
                  key={config.teamGroupId}
                  className={`border-b hover:bg-gray-50 ${isSaving ? 'opacity-50' : ''}`}
                >
                  <td className="px-3 py-2 font-medium">{config.teamName}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] ${
                        config.isEnabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {config.isEnabled ? 'Aktiviert' : 'Deaktiviert'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={config.scope || ''}
                      onChange={(e) =>
                        handleScopeChange(config, (e.target.value || null) as DataScope | null)
                      }
                      disabled={isSaving}
                      className="rounded border px-2 py-1 text-sm"
                    >
                      <option value="">Standard ({moduleData.module.defaultScope})</option>
                      {moduleData.module.allowedScopes.map((scope) => (
                        <option key={scope} value={scope}>
                          {scope}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] ${
                        effectiveScope === 'GLOBAL'
                          ? 'bg-green-100 text-green-700'
                          : effectiveScope === 'TEAM'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {effectiveScope}
                    </span>
                  </td>
                  <td className="space-x-2 px-3 py-2">
                    <button
                      onClick={() => handleToggleEnabled(config)}
                      disabled={isSaving}
                      className={`hover:underline disabled:opacity-50 ${
                        config.isEnabled ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {config.isEnabled ? 'Deaktivieren' : 'Aktivieren'}
                    </button>
                    <Link
                      to={`/admin/teams/${config.teamGroupId}/modules`}
                      className="text-blue-600 hover:underline"
                    >
                      Alle Module
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filteredTeams.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-gray-500">
                  Keine Teams gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function ModuleConfigPage() {
  const { moduleId } = useParams<{ moduleId?: string }>();
  const [modules, setModules] = useState<ModuleWithConfigs[]>([]);
  const [moduleDetail, setModuleDetail] = useState<ModuleWithConfigs | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadModules = () => {
    setLoading(true);
    void listModules()
      .then((data) => {
        setModules(data);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const loadModuleDetail = (id: string) => {
    setLoading(true);
    void getModule(id)
      .then((data) => {
        setModuleDetail(data);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (moduleId) {
      loadModuleDetail(moduleId);
    } else {
      loadModules();
    }
  }, [moduleId]);

  // Show detail view if moduleId is present
  if (moduleId) {
    return (
      <div className="space-y-4">
        <ModuleDetailView
          moduleData={moduleDetail}
          loading={loading}
          onRefresh={() => loadModuleDetail(moduleId)}
        />
      </div>
    );
  }

  // Show list view otherwise
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Modulkonfiguration</h1>
      </div>

      <p className="text-sm text-gray-600">
        Konfigurieren Sie, welche Module fuer welche Teams verfuegbar sind und welchen Daten-Scope
        sie verwenden.
      </p>

      <ModuleListView
        modules={modules}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
      />
    </div>
  );
}
