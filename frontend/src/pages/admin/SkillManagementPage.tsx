import { useEffect, useMemo, useState } from 'react'
import { importSkillGroups, type SkillImportPayload } from '@/services/skills.service'
import {
  CategoryTree,
  SkillSummary,
  fetchCategoriesTree,
  fetchSkills,
  createCategory,
  updateCategory,
  deleteCategory,
  createSkill,
  updateSkill,
  deleteSkill,
  reactivateCategory,
  deleteCategoryPermanent,
} from '@/services/skill.service'
import { CategoryForm } from '@/components/admin/CategoryForm'
import { SkillForm } from '@/components/admin/SkillForm'

export default function SkillManagementPage() {
  const [tree, setTree] = useState<CategoryTree[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [skills, setSkills] = useState<SkillSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [includeInactive, setIncludeInactive] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState<{
    mode: 'create' | 'edit'
    category?: CategoryTree
  } | null>(null)
  const [showSkillForm, setShowSkillForm] = useState<{
    mode: 'create' | 'edit'
    skill?: SkillSummary
  } | null>(null)
  const [importJson, setImportJson] = useState('')
  const [importBusy, setImportBusy] = useState(false)
  const [importResult, setImportResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const selectedCategory = useMemo(() => {
    const map = new Map<string, CategoryTree>()
    const walk = (nodes: CategoryTree[]) => {
      for (const n of nodes) {
        map.set(n.id, n)
        if (n.children?.length) walk(n.children)
      }
    }
    walk(tree)
    return selectedCategoryId ? map.get(selectedCategoryId) || null : null
  }, [tree, selectedCategoryId])

  const load = async () => {
    setLoading(true)
    try {
      const t = await fetchCategoriesTree(includeInactive)
      setTree(t)
      if (selectedCategoryId) {
        const s = await fetchSkills({ categoryId: selectedCategoryId, isActive: true })
        setSkills(s)
      } else {
        setSkills([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, includeInactive])

  const handleCreateCategory = async (data: { name: string; parentId?: string | null; description?: string | null; displayOrder?: number }) => {
    await createCategory(data)
    setShowCategoryForm(null)
    await load()
  }
  const handleUpdateCategory = async (
    id: string,
    data: Partial<{ name: string; parentId: string | null; description: string | null; displayOrder: number; isActive: boolean }>
  ) => {
    await updateCategory(id, data)
    setShowCategoryForm(null)
    await load()
  }
  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id)
    if (selectedCategoryId === id) setSelectedCategoryId(null)
    await load()
  }

  const handleCreateSkill = async (payload: { name: string; categoryId: string; description?: string | null; displayOrder?: number }) => {
    await createSkill(payload)
    setShowSkillForm(null)
    await load()
  }
  const handleUpdateSkill = async (
    id: string,
    data: Partial<{ name: string; categoryId: string; description: string | null; displayOrder: number; isActive: boolean }>
  ) => {
    await updateSkill(id, data)
    setShowSkillForm(null)
    await load()
  }
  const handleDeleteSkill = async (id: string) => {
    await deleteSkill(id)
    await load()
  }

  return (
    <div className="space-y-4">
      {/* Import Panel */}
      <div className="border rounded-lg p-4 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">Skillkategorien importieren</h2>
            <p className="text-sm text-gray-600">Füge hier dein JSON (skillGroups) ein. Existierende Kategorien werden wiederverwendet, Skills duplizieren nicht.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm shadow disabled:opacity-50"
              disabled={importBusy || !importJson.trim()}
              onClick={async () => {
                setImportBusy(true)
                setImportResult(null)
                try {
                  const payload = JSON.parse(importJson) as SkillImportPayload
                  const res = await importSkillGroups(payload)
                  setImportResult({ ok: true, msg: `Import erfolgreich: ${res.createdCategories} Kategorien, ${res.createdSkills} Skills, ${res.skippedSkills} übersprungen.` })
                  setImportJson('')
                  await load()
                } catch (err: any) {
                  const msg = err?.response?.data?.message || err?.message || 'Unbekannter Fehler'
                  setImportResult({ ok: false, msg })
                } finally {
                  setImportBusy(false)
                }
              }}
            >Skillkategorien importieren</button>
          </div>
        </div>
        <textarea
          className="mt-3 w-full min-h-[140px] border rounded p-2 font-mono text-xs"
          placeholder='{"skillGroups": [{"title":"Kategorie","skills":[{"name":"Skill"}]}]}'
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
        />
        {importResult && (
          <div className={`mt-2 text-sm ${importResult.ok ? 'text-emerald-700' : 'text-red-700'}`}>{importResult.msg}</div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
      <aside className="col-span-4 border rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Kategorien</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />
              Inaktive anzeigen
            </label>
            <button
              className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm shadow"
              onClick={() => setShowCategoryForm({ mode: 'create' })}
            >
              Neue Kategorie
            </button>
          </div>
        </div>
        {loading && <div className="text-sm text-gray-500">Lade ...</div>}
        <CategoryTreeView
          nodes={tree}
          selectedId={selectedCategoryId}
          onSelect={(id) => setSelectedCategoryId(id)}
          onEdit={(c) => setShowCategoryForm({ mode: 'edit', category: c })}
          onDelete={(id) => handleDeleteCategory(id)}
          onReactivate={async (id) => { await reactivateCategory(id); await load() }}
          onHardDelete={async (id) => {
            if (!confirm('Diese Kategorie und alle Unterkategorien und Skills endgültig löschen? Dies kann nicht rückgängig gemacht werden.')) return
            await deleteCategoryPermanent(id)
            if (selectedCategoryId === id) setSelectedCategoryId(null)
            await load()
          }}
        />
      </aside>

      <section className="col-span-8 border rounded-lg p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Skills</h2>
          <button
            className={`px-3 py-1 rounded text-sm shadow ${selectedCategory ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-gray-200 text-gray-600 cursor-not-allowed'}`}
            onClick={() => {
              if (!selectedCategory) return alert('Bitte zuerst eine Kategorie links auswählen.');
              setShowSkillForm({ mode: 'create' })
            }}
          >
            Neuer Skill
          </button>
        </div>
        {!selectedCategory && <div className="text-sm text-gray-500">Kategorie wählen, um Skills zu sehen oder anzulegen.</div>}
        {selectedCategory && (
          <>
            {skills.length === 0 ? (
              <div className="text-sm text-gray-600 border rounded p-4 flex items-center justify-between">
                <span>In dieser Kategorie sind noch keine Skills vorhanden.</span>
                <button
                  className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-sm shadow"
                  onClick={() => setShowSkillForm({ mode: 'create' })}
                >
                  Jetzt Skill anlegen
                </button>
              </div>
            ) : (
              <SkillsTable
                items={skills}
                onEdit={(s) => setShowSkillForm({ mode: 'edit', skill: s })}
                onDelete={(id) => handleDeleteSkill(id)}
              />
            )}
          </>
        )}
      </section>

      {showCategoryForm && (
        <CategoryForm
          mode={showCategoryForm.mode}
          category={showCategoryForm.category}
          allCategories={tree}
          onCancel={() => setShowCategoryForm(null)}
          onCreate={handleCreateCategory}
          onUpdate={(id, data) => handleUpdateCategory(id, data)}
        />
      )}

      {showSkillForm && selectedCategory && (
        <SkillForm
          mode={showSkillForm.mode}
          skill={showSkillForm.skill}
          categoryId={selectedCategory.id}
          onCancel={() => setShowSkillForm(null)}
          onCreate={(data) => handleCreateSkill({ ...data, categoryId: selectedCategory.id })}
          onUpdate={(id, data) => handleUpdateSkill(id, data)}
        />
      )}
      </div>
    </div>
  )
}

function CategoryTreeView(props: {
  nodes: CategoryTree[]
  selectedId: string | null
  onSelect: (id: string) => void
  onEdit: (c: CategoryTree) => void
  onDelete: (id: string) => void
  onReactivate: (id: string) => void
  onHardDelete: (id: string) => void
}) {
  const { nodes, selectedId, onSelect, onEdit, onDelete } = props
  return (
    <ul className="space-y-1 text-sm">
      {nodes.map((n) => (
        <li key={n.id}>
          <div className={`flex items-center justify-between rounded px-2 py-1 ${selectedId === n.id ? 'bg-gray-100' : ''}`}>
            <button className="text-left flex-1" onClick={() => onSelect(n.id)}>
              <span>{n.name}</span>
              {!n.isActive && <span className="ml-2 inline-block text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700">inaktiv</span>}
            </button>
            <div className="space-x-2">
              <button className="text-blue-600" onClick={() => onEdit(n)}>Bearbeiten</button>
              {n.isActive ? (
                <button className="text-red-600" onClick={() => onDelete(n.id)}>Deaktivieren</button>
              ) : (
                <>
                  <button className="text-emerald-700" onClick={() => props.onReactivate(n.id)}>Reaktivieren</button>
                  <button className="text-red-700" onClick={() => props.onHardDelete(n.id)}>Permanent löschen</button>
                </>
              )}
            </div>
          </div>
          {n.children?.length ? (
            <div className="ml-4">
              <CategoryTreeView nodes={n.children} selectedId={selectedId} onSelect={onSelect} onEdit={onEdit} onDelete={onDelete} onReactivate={props.onReactivate} onHardDelete={props.onHardDelete} />
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}

function SkillsTable(props: { items: SkillSummary[]; onEdit: (s: SkillSummary) => void; onDelete: (id: string) => void }) {
  const { items, onEdit, onDelete } = props
  if (!items.length) return <div className="text-sm text-gray-500">Keine Skills vorhanden.</div>
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left border-b">
          <th className="py-2">Name</th>
          <th className="py-2">Beschreibung</th>
          <th className="py-2 w-32">Aktionen</th>
        </tr>
      </thead>
      <tbody>
        {items.map((s) => (
          <tr key={s.id} className="border-b">
            <td className="py-2">{s.name}</td>
            <td className="py-2 text-gray-600">{s.description}</td>
            <td className="py-2 space-x-2">
              <button className="text-blue-600" onClick={() => onEdit(s)}>Bearbeiten</button>
              <button className="text-red-600" onClick={() => onDelete(s.id)}>Löschen</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
