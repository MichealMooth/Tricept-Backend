/**
 * Team Module Configuration Page
 *
 * Displays and allows editing of module configurations for a specific team.
 *
 * Task Group 5.4: Create TeamModuleConfigPage
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  getTeamConfig,
  upsertConfig,
  getAffectedCount,
  TeamWithModuleConfigs,
  TeamModuleConfig,
  DataScope,
} from '@/services/admin-module-config.service';
import { listModules, ModuleWithConfigs } from '@/services/admin-module-config.service';

interface EditingConfig {
  moduleId: string;
  isEnabled: boolean;
  scope: DataScope | null;
}

export default function TeamModuleConfigPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const [teamConfig, setTeamConfig] = useState<TeamWithModuleConfigs | null>(null);
  const [modules, setModules] = useState<ModuleWithConfigs[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<EditingConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [warningCount, setWarningCount] = useState<number | null>(null);

  const load = async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const [config, allModules] = await Promise.all([
        getTeamConfig(teamId),
        listModules(),
      ]);
      setTeamConfig(config);
      setModules(allModules);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [teamId]);

  const handleEdit = (config: TeamModuleConfig) => {
    setEditing({
      moduleId: config.moduleId,
      isEnabled: config.isEnabled,
      scope: config.scope,
    });
    setWarningCount(null);
  };

  const handleCancel = () => {
    setEditing(null);
    setWarningCount(null);
  };

  const handleToggleEnabled = async (config: TeamModuleConfig) => {
    if (!teamId) return;

    // If disabling, show warning with affected count
    if (config.isEnabled) {
      const { count } = await getAffectedCount(teamId, config.moduleId);
      if (count > 0) {
        const confirmed = window.confirm(
          `Achtung: ${count} Datensaetze werden fuer dieses Team unsichtbar. Fortfahren?`
        );
        if (!confirmed) return;
      }
    }

    setSaving(true);
    try {
      await upsertConfig({
        teamGroupId: teamId,
        moduleId: config.moduleId,
        isEnabled: !config.isEnabled,
        scope: config.scope,
      });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!teamId || !editing) return;

    // Check for warnings when disabling
    if (!editing.isEnabled && warningCount === null) {
      const { count } = await getAffectedCount(teamId, editing.moduleId);
      if (count > 0) {
        setWarningCount(count);
        return;
      }
    }

    setSaving(true);
    try {
      await upsertConfig({
        teamGroupId: teamId,
        moduleId: editing.moduleId,
        isEnabled: editing.isEnabled,
        scope: editing.scope,
      });
      setEditing(null);
      setWarningCount(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const getModuleInfo = (moduleId: string) => {
    return modules.find((m) => m.module.id === moduleId)?.module;
  };

  if (loading) {
    return <div className="text-sm text-gray-600">Lade...</div>;
  }

  if (!teamConfig) {
    return <div className="text-sm text-red-600">Team nicht gefunden</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link to="/admin/modules" className="text-blue-600 hover:underline">
          Modulkonfiguration
        </Link>
        <span className="text-gray-400">/</span>
        <span className="font-medium">{teamConfig.teamName}</span>
      </div>

      <h1 className="text-2xl font-semibold">
        Modulkonfiguration fuer {teamConfig.teamName}
      </h1>

      <p className="text-sm text-gray-600">
        Konfigurieren Sie, welche Module fuer dieses Team aktiviert sind und welchen Daten-Scope sie verwenden.
      </p>

      <div className="overflow-auto border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b bg-gray-50">
              <th className="py-2 px-3">Modul</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Konfigurierter Scope</th>
              <th className="py-2 px-3">Effektiver Scope</th>
              <th className="py-2 px-3 w-48">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {teamConfig.configs.map((config) => {
              const moduleInfo = getModuleInfo(config.moduleId);
              const isEditing = editing?.moduleId === config.moduleId;

              return (
                <tr
                  key={config.moduleId}
                  className={`border-b ${isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <td className="py-2 px-3 font-medium">{config.moduleName}</td>
                  <td className="py-2 px-3">
                    {isEditing ? (
                      <select
                        value={editing.isEnabled ? 'true' : 'false'}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            isEnabled: e.target.value === 'true',
                          })
                        }
                        className="border rounded px-2 py-1"
                      >
                        <option value="true">Aktiviert</option>
                        <option value="false">Deaktiviert</option>
                      </select>
                    ) : (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded ${
                          config.isEnabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {config.isEnabled ? 'Aktiviert' : 'Deaktiviert'}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    {isEditing ? (
                      <select
                        value={editing.scope || ''}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            scope: (e.target.value || null) as DataScope | null,
                          })
                        }
                        className="border rounded px-2 py-1"
                      >
                        <option value="">Standard verwenden</option>
                        {moduleInfo?.allowedScopes.map((scope) => (
                          <option key={scope} value={scope}>
                            {scope}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-gray-600">
                        {config.scope || 'Standard'}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded ${
                        config.effectiveScope === 'GLOBAL'
                          ? 'bg-green-100 text-green-700'
                          : config.effectiveScope === 'TEAM'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {config.effectiveScope}
                    </span>
                  </td>
                  <td className="py-2 px-3 space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="text-green-600 hover:underline disabled:opacity-50"
                        >
                          {saving ? 'Speichert...' : 'Speichern'}
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={saving}
                          className="text-gray-600 hover:underline disabled:opacity-50"
                        >
                          Abbrechen
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(config)}
                          className="text-blue-600 hover:underline"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleToggleEnabled(config)}
                          disabled={saving}
                          className={`hover:underline ${
                            config.isEnabled ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {config.isEnabled ? 'Deaktivieren' : 'Aktivieren'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Warning dialog for disabling module */}
      {warningCount !== null && warningCount > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-2">Warnung</h3>
            <p className="text-gray-600 mb-4">
              {warningCount} Datensaetze werden fuer dieses Team unsichtbar, wenn Sie dieses Modul deaktivieren.
              Die Daten werden nicht geloescht und koennen durch Reaktivierung wieder sichtbar gemacht werden.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded border hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  setWarningCount(null);
                  handleSave();
                }}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Trotzdem deaktivieren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
