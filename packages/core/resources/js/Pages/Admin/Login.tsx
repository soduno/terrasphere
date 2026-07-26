import { Head } from '@inertiajs/react'
import { Layers, LockKeyhole, Moon, Sun } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import { api } from '@adapter/api'
import { ThemeProvider, useTheme } from '@components/ThemeProvider'
import { Button } from '@ui/button'
import { Checkbox } from '@ui/checkbox'
import { Input } from '@ui/input'
import { Label } from '@ui/label'

export default function Login() {
  return (
    <ThemeProvider>
      <LoginPage />
    </ThemeProvider>
  )
}

function LoginPage() {
  const { theme, toggleTheme } = useTheme()
  const [login, setLogin] = useState('mail@simonduun.com')
  const [password, setPassword] = useState('1234')
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [processing, setProcessing] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrors({})

    api.post(
      '/admin/login',
      { login, password, remember },
      {
        inertia: true,
        onStart: () => setProcessing(true),
        onError: (nextErrors) => {
          setErrors(nextErrors as Record<string, string>)
        },
        onSuccess: () => setPassword(''),
        onFinish: () => setProcessing(false),
      },
    )
  }

  return (
    <>
      <Head title="Sign in" />
      <main className="min-h-screen bg-gray-50 px-6 py-12 dark:bg-gray-950">
        <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md items-center">
          <section className="w-full rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-gray-200/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none sm:p-10">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl text-gray-900 dark:text-white">Terrasphere admin</h1>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === 'light' ? 'Use dark mode' : 'Use light mode'}
                title={theme === 'light' ? 'Use dark mode' : 'Use light mode'}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login">Email or username</Label>
                    <Input
                      id="login"
                      name="login"
                      type="text"
                      autoComplete="username"
                      value={login}
                      onChange={(event) => setLogin(event.target.value)}
                      autoFocus
                      required
                      aria-invalid={Boolean(errors.login)}
                      className="h-11 rounded-xl"
                    />
                    {errors.login && <p className="text-sm text-red-600">{errors.login}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      aria-invalid={Boolean(errors.password)}
                      className="h-11 rounded-xl"
                    />
                    {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                  </div>

                  <label
                    htmlFor="remember"
                    className="group flex cursor-pointer items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm transition-colors hover:border-indigo-100 hover:bg-indigo-50/70 dark:hover:border-indigo-900 dark:hover:bg-indigo-950/30"
                  >
                    <Checkbox
                      id="remember"
                      checked={remember}
                      onCheckedChange={(checked) => setRemember(checked === true)}
                      className="h-5 w-5 rounded-md border-2 border-gray-300 bg-white shadow-sm transition-all data-[state=checked]:scale-105 data-[state=checked]:border-indigo-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white focus-visible:border-indigo-500 focus-visible:ring-indigo-500/25 dark:border-gray-600 dark:bg-gray-800 dark:data-[state=checked]:border-indigo-500 dark:data-[state=checked]:bg-indigo-500"
                    />
                    <span className="font-medium text-gray-600 transition-colors group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-gray-200">
                      Keep me signed in
                    </span>
                  </label>

                  <Button
                    type="submit"
                    disabled={processing}
                    className="h-11 w-full rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    <LockKeyhole className="h-4 w-4" />
                    {processing ? 'Signing in…' : 'Sign in'}
                  </Button>
            </form>
          </section>
        </div>
      </main>
    </>
  )
}
