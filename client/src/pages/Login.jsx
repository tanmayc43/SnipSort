import { useState, useEffect } from "react"
import { Link, useNavigate } from 'react-router-dom'
import { UserAuth } from "../context/AuthContext"
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { ToggleButton } from '../components/ToggleButton'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useFormValidation, commonSchemas } from '@/hooks/useFormValidation'
import { toast } from 'sonner'
import { Mail, Lock, Eye, EyeOff, Code2} from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { signInUser, signInWithGoogle, session, loading: authLoading } = UserAuth()
  const [showPassword, setShowPassword] = useState(false)

  const {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldError
  } = useFormValidation(
    { email: "", password: "" },
    {
      email: commonSchemas.auth.email,
      password: [commonSchemas.auth.password[0]] // Only required validation for login
    }
  )

  // Redirect if already authenticated
  useEffect(() => {
    if (session && !authLoading) {
      navigate('/dashboard')
    }
  }, [session, authLoading, navigate])

  const onSubmit = async (formData) => {
    try {
      const result = await signInUser(formData.email, formData.password)
      if (result.success) {
        toast.success('Welcome back!', {
          description: 'You have been successfully signed in.'
        })
        navigate('/dashboard')
      } else {
        // Set field-specific errors if available
        if (result.error.includes('email')) {
          setFieldError('email', result.error)
        } else if (result.error.includes('password')) {
          setFieldError('password', result.error)
        } else {
          toast.error('Sign in failed', { description: result.error })
        }
      }
    } catch (error) {
      toast.error('Sign in failed', { description: error.message })
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle()
      if (!result.success) {
        toast.error('Google sign in failed', { description: result.error })
      }
    } catch (error) {
      toast.error('Google sign in failed', { description: error.message })
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <nav className='flex items-center justify-between px-4 py-3 border-b'> 
        <div className="flex items-center gap-3">
          <Code2 className="h-6 w-6" />
          <Link to="/" className="text-lg font-semibold">
            SnipSort
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <ToggleButton />
        </div>
      </nav>
      
      <section className="flex min-h-screen px-4 py-16 md:py-32">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(onSubmit)
          }}
          className="bg-card m-auto h-fit w-full max-w-sm rounded-[calc(var(--radius)+.125rem)] border p-0.5 shadow-md"
        >
          <div className="p-8 pb-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
              <p className="text-muted-foreground">Sign in to your account to continue</p>
            </div>

            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignIn}
                className="w-full"
                disabled={isSubmitting}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="0.98em"
                  height="1em"
                  viewBox="0 0 256 262"
                  className="mr-2"
                >
                  <path
                    fill="#4285f4"
                    d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                  />
                  <path
                    fill="#34a853"
                    d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                  />
                  <path
                    fill="#fbbc05"
                    d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                  />
                  <path
                    fill="#eb4335"
                    d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                  />
                </svg>
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <FormField
                label="Email"
                type="email"
                name="email"
                value={values.email}
                onChange={(e) => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                error={touched.email ? errors.email : null}
                leftIcon={<Mail className="h-4 w-4" />}
                placeholder="Enter your email"
                disabled={isSubmitting}
                required
              />

              <FormField
                label="Password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={values.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                error={touched.password ? errors.password : null}
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                onRightIconClick={() => setShowPassword(!showPassword)}
                placeholder="Enter your password"
                disabled={isSubmitting}
                required
              />

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="remember" className="text-muted-foreground">
                    Remember me
                  </label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || !isValid}
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </div>
          </div>

          <div className="bg-muted rounded-b-[calc(var(--radius)+.125rem)] border-t p-4">
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Create account
              </Link>
            </p>
          </div>
        </form>
      </section>
    </>
  )
}