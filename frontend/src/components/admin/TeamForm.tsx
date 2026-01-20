/**
 * TeamForm Component
 *
 * Modal form for creating and editing teams.
 * Fields: name (required), description (optional)
 *
 * Task Group 3.2
 */

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const teamSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  description: z.string().optional(),
})

type TeamFormValues = z.infer<typeof teamSchema>

export interface TeamFormProps {
  mode: 'create' | 'edit'
  initial?: Partial<TeamFormValues>
  onCancel: () => void
  onSubmit: (data: TeamFormValues) => Promise<void>
}

export function TeamForm(props: TeamFormProps) {
  const { mode, initial, onCancel, onSubmit } = props

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  useEffect(() => {
    reset({
      name: initial?.name ?? '',
      description: initial?.description ?? '',
    })
  }, [initial, reset])

  const handleFormSubmit = async (values: TeamFormValues) => {
    await onSubmit({
      name: values.name,
      description: values.description || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
        <h3 className="mb-4 text-lg font-semibold">
          {mode === 'create' ? 'Team anlegen' : 'Team bearbeiten'}
        </h3>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="grid gap-4">
          <div>
            <label htmlFor="team-name" className="mb-1 block text-sm font-medium">
              Name
            </label>
            <input
              id="team-name"
              className="w-full rounded border px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...register('name')}
              placeholder="Teamname"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="team-description" className="mb-1 block text-sm font-medium">
              Beschreibung
            </label>
            <textarea
              id="team-description"
              className="w-full rounded border px-3 py-2 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              {...register('description')}
              placeholder="Optionale Beschreibung"
              rows={3}
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="rounded border border-gray-300 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50"
              onClick={onCancel}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-indigo-600 px-3 py-2 text-white shadow hover:bg-indigo-700 disabled:opacity-50"
            >
              {mode === 'create' ? 'Anlegen' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
