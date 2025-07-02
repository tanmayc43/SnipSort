import { useState } from "react"
import { Link, useNavigate } from 'react-router-dom'
import { UserAuth } from "../context/AuthContext"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleButton } from '@/components/ToggleButton'
import { useToast } from '@/hooks/use-toast'

export default function SignUp() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { signUpUser, signInWithGoogle } = UserAuth()
    const { toast } = useToast()

    const handleSignUp = async (e) => {
        e.preventDefault()
        setLoading(true)

        try{
            const result = await signUpUser(email, password, fullName)
            if(result.success){
                toast({
                    title: "Account created!",
                    description: "Welcome to SnipSort. You can now start organizing your code snippets.",
                })
                navigate('/dashboard')
            }
            else{
                toast({
                    title: "Sign up failed",
                    description: result.error,
                    variant: "destructive",
                })
            }
        }
        catch(error){
            toast({
                title: "Sign up failed",
                description: error.message,
                variant: "destructive",
            })
        }
        finally{
            setLoading(false)
        }
    }

    // not implemented yet
    const handleGoogleSignIn = async () => {
        try{
            const result = await signInWithGoogle()
            if(!result.success){
                toast({
                    title: "Google sign in failed",
                    description: result.error,
                    variant: "destructive",
                })
            }
        }
        catch(error){
            toast({
                title: "Google sign in failed",
                description: error.message,
                variant: "destructive",
            })
        }
    }

    return (
        <>
            <nav className='flex items-center justify-between px-4 py-3'>
                <Link to="/" className="text-lg font-semibold">
                    SnipSort
                </Link>
                <div className="flex items-center gap-2">
                    <ToggleButton />
                </div>
            </nav>
            <section className="flex min-h-screen px-4 py-16 md:py-32">
                <form onSubmit={handleSignUp} className="bg-card m-auto h-fit w-full max-w-sm rounded-[calc(var(--radius)+.125rem)] border p-0.5 shadow-md">
                    <div className="p-8 pb-6">
                        <div>
                            <h1 className="text-title mb-1 mt-4 text-xl font-semibold">Create a SnipSort Account</h1>
                            <p className="text-sm">Welcome! Create an account to get started</p>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleGoogleSignIn}
                                className="w-full"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="0.98em"
                                    height="1em"
                                    viewBox="0 0 256 262">
                                    <path
                                        fill="#4285f4"
                                        d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"></path>
                                    <path
                                        fill="#34a853"
                                        d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"></path>
                                    <path
                                        fill="#fbbc05"
                                        d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"></path>
                                    <path
                                        fill="#eb4335"
                                        d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"></path>
                                </svg>
                                <span>Continue with Google</span>
                            </Button>
                        </div>

                        <hr className="my-4 border-dashed" />

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="fullName" className="block text-sm">
                                    Full Name
                                </Label>
                                <Input
                                    type="text"
                                    required
                                    name="fullName"
                                    id="fullName"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter your full name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="block text-sm">
                                    Email
                                </Label>
                                <Input
                                    type="email"
                                    required
                                    name="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-title text-sm">
                                    Password
                                </Label>
                                <Input
                                    type="password"
                                    required
                                    name="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <Button className="w-full" type="submit" disabled={loading}>
                                {loading ? 'Creating account...' : 'Continue'}
                            </Button>
                        </div>
                    </div>

                    <div className="bg-muted rounded-(--radius) border p-3">
                        <p className="text-accent-foreground text-center text-sm">
                            Have an account ?
                            <Button asChild variant="link" className="px-2">
                                <Link to="/login">Login</Link>
                            </Button>
                        </p>
                    </div>
                </form>
            </section>
        </>
    )
}