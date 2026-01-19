import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  name: z.string().min(1).max(300),
  description: z.string().max(2000).nullable().optional(),
  displayOrder: z.coerce.number().int().min(0).optional(),
})

type FormValues = z.infer<typeof schema>

export function SkillForm(props: {
  mode: 'create' | 'edit'
  skill?: { id: string; name: string; description: string | null; displayOrder: number }
  categoryId: string
  onCancel: () => void
  onCreate: (data: { name: string; description?: string | null; displayOrder?: number }) => Promise<void>
  onUpdate: (id: string, data: Partial<{ name: string; description: string | null; displayOrder: number }>) => Promise<void>
}) {
  const { mode, skill, onCancel, onCreate, onUpdate } = props
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (mode === 'edit' && skill) {
      reset({ name: skill.name, description: skill.description ?? undefined, displayOrder: skill.displayOrder ?? 0 })
    } else {
      reset({ displayOrder: 0 } as any)
    }
  }, [mode, skill, reset])

  const onSubmit = async (values: FormValues) => {
    if (mode === 'create') {
      await onCreate(values)
    } else if (mode === 'edit' && skill) {
      await onUpdate(skill.id, values)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold mb-4">{mode === 'create' ? 'Skill anlegen' : 'Skill bearbeiten'}</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input className="w-full border rounded px-3 py-2" {...register('name')} />
            {errors.name && <p className="text-xs text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Beschreibung</label>
            <textarea className="w-full border rounded px-3 py-2" rows={3} {...register('description')} />
            {errors.description && <p className="text-xs text-red-600">{errors.description.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reihenfolge</label>
            <input type="number" className="w-full border rounded px-3 py-2" {...register('displayOrder')} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50" onClick={onCancel}>Abbrechen</button>
            <button disabled={isSubmitting} className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white shadow disabled:opacity-60">{mode === 'create' ? 'Anlegen' : 'Speichern'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
