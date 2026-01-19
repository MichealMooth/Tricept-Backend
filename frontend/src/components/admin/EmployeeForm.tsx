import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(10).optional(), // only required on create
  role: z.string().optional(),
  department: z.string().optional(),
  isAdmin: z.boolean().optional(),
  isActive: z.boolean().optional(),
  hireDate: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function EmployeeForm(props: {
  mode: 'create' | 'edit'
  initial?: Partial<FormValues>
  onCancel: () => void
  onCreate: (data: Required<Pick<FormValues, 'email' | 'password' | 'firstName' | 'lastName'>> & Partial<FormValues>) => Promise<void>
  onUpdate: (data: Partial<FormValues>) => Promise<void>
}) {
  const { mode, initial, onCancel, onCreate, onUpdate } = props

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    reset({
      firstName: initial?.firstName ?? '',
      lastName: initial?.lastName ?? '',
      email: initial?.email ?? '',
      role: initial?.role ?? '',
      department: initial?.department ?? 'Consulting',
      isAdmin: initial?.isAdmin ?? false,
      isActive: initial?.isActive ?? true,
      hireDate: initial?.hireDate ?? '',
    })
  }, [initial, reset])

  const onSubmit = async (values: FormValues) => {
    if (mode === 'create') {
      if (!values.password) {
        return
      }
      await onCreate({
        email: values.email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        role: values.role,
        department: values.department,
        isAdmin: values.isAdmin,
        isActive: values.isActive,
        hireDate: values.hireDate,
      })
    } else {
      await onUpdate(values)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        <h3 className="text-lg font-semibold mb-4">{mode === 'create' ? 'Mitarbeiter anlegen' : 'Mitarbeiter bearbeiten'}</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 grid-cols-2">
          <div className="col-span-1">
            <label className="block text-sm mb-1">Vorname</label>
            <input className="w-full border rounded px-3 py-2" {...register('firstName')} />
            {errors.firstName && <p className="text-xs text-red-600">{errors.firstName.message}</p>}
          </div>
          <div className="col-span-1">
            <label className="block text-sm mb-1">Nachname</label>
            <input className="w-full border rounded px-3 py-2" {...register('lastName')} />
            {errors.lastName && <p className="text-xs text-red-600">{errors.lastName.message}</p>}
          </div>
          <div className="col-span-2">
            <label className="block text-sm mb-1">E-Mail</label>
            <input className="w-full border rounded px-3 py-2" type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>
          {mode === 'create' && (
            <div className="col-span-2">
              <label className="block text-sm mb-1">Passwort</label>
              <input className="w-full border rounded px-3 py-2" type="password" {...register('password')} />
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>
          )}
          <div className="col-span-1">
            <label className="block text-sm mb-1">Rolle</label>
            <input className="w-full border rounded px-3 py-2" {...register('role')} />
          </div>
          <div className="col-span-1">
            <label className="block text-sm mb-1">Abteilung</label>
            <input className="w-full border rounded px-3 py-2" {...register('department')} />
          </div>
          <div className="col-span-1">
            <label className="block text-sm mb-1">Eintrittsdatum</label>
            <input className="w-full border rounded px-3 py-2" type="date" {...register('hireDate')} />
          </div>
          <div className="col-span-1 flex items-center gap-2">
            <input type="checkbox" {...register('isAdmin')} />
            <span>Admin</span>
          </div>
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-3 py-2 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
              onClick={onCancel}
            >
              Abbrechen
            </button>
            <button
              disabled={isSubmitting}
              className="px-3 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white shadow disabled:opacity-50"
            >
              {mode === 'create' ? 'Anlegen' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
