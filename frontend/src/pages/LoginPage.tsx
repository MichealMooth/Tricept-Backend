import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import * as Auth from '@/services/auth.service'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(10, 'Mindestens 10 Zeichen'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation() as any
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setError(null)
    try {
      await login(values.email, values.password)
      const redirectTo = location.state?.from?.pathname || '/'
      navigate(redirectTo, { replace: true })
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Login fehlgeschlagen')
    }
  }

  const onRegister = async (values: FormValues & { firstName?: string; lastName?: string }) => {
    setError(null)
    try {
      const payload = {
        email: values.email,
        password: values.password,
        firstName: values.firstName || 'User',
        lastName: values.lastName || 'Neu',
      }
      await Auth.register(payload)
      await login(values.email, values.password)
      const redirectTo = '/'
      navigate(redirectTo, { replace: true })
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Registrierung fehlgeschlagen')
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg p-6 shadow">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">{mode === 'login' ? 'Anmelden' : 'Registrieren'}</h1>
          <button className="text-sm underline" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} type="button">
            {mode === 'login' ? 'Neu registrieren' : 'Schon ein Konto? Anmelden'}
          </button>
        </div>

        <form onSubmit={handleSubmit(mode === 'login' ? onSubmit : onRegister)} className="space-y-3">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">E-Mail</label>
            <input id="email" type="email" className="w-full border rounded px-3 py-2" {...register('email')} />
            {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Passwort</label>
            <input id="password" type="password" className="w-full border rounded px-3 py-2" {...register('password')} />
            {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
          </div>
          {mode === 'register' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium mb-1">Vorname</label>
                <input id="firstName" className="w-full border rounded px-3 py-2" {...register('firstName' as any)} />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium mb-1">Nachname</label>
                <input id="lastName" className="w-full border rounded px-3 py-2" {...register('lastName' as any)} />
              </div>
            </div>
          )}
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button disabled={isSubmitting} className="w-full py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white shadow">
            {isSubmitting ? (mode === 'login' ? 'Anmelden…' : 'Registrieren…') : (mode === 'login' ? 'Anmelden' : 'Registrieren')}
          </button>
        </form>
      </div>
    </div>
  )
}
