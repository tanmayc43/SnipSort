import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserAuth } from '../context/AuthContext'

export default function Dashboard() {
    const { session, loading } = UserAuth()
    const navigate = useNavigate()

    useEffect(() => {
        if (!loading) {
            if (!session) {
                navigate('/login')
            } else {
                navigate('/dashboard/snippets')
            }
        }
    }, [session, loading, navigate])

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return null
}