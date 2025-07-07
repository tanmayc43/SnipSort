import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SnippetEditor from '@/components/snippets/SnippetEditor'
import { snippetService } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { UserAuth } from '@/context/AuthContext'

// need to improve this, make it floating and add better context additions for folder and project selection

export default function EditSnippet() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { session } = UserAuth()
  const [snippet, setSnippet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notAllowed, setNotAllowed] = useState(false)

  useEffect(() => {
    loadSnippet()
  }, [id])

  const loadSnippet = async () => {
    try{
      const data = await snippetService.getSnippet(id)
      setSnippet(data)
      // only allow owner/admin to edit
      let members = []
      let role = null
      if (data.project_id && data.projects && data.projects.members) {
        members = data.projects.members
        const member = members.find(m => m.userId === session?.user?.id || m.user_id === session?.user?.id)
        role = member?.role || 'member'
      }

      // folder based checking?
      if (role === 'member' || !role) {
        setNotAllowed(true)
      }
    } 
    catch(error){
      //console.error('Error loading snippet:', error)
      toast({
        title: "Error",
        description: "Failed to load snippet. Please try again.",
        variant: "destructive",
      })
      navigate('/dashboard/snippets')
    } 
    finally{
      setLoading(false)
    }
  }

  if(loading){
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  if(notAllowed){
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4 text-destructive">Not authorized</h1>
        <p className="mb-4">You do not have permission to edit this snippet.</p>
        <button onClick={() => navigate('/dashboard/snippets')} className="btn btn-primary">
          Back to Snippets
        </button>
      </div>
    )
  }

  if(!snippet){
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Snippet not found</h1>
        <button onClick={() => navigate('/dashboard/snippets')}>
          Back to Snippets
        </button>
      </div>
    )
  }

  return <SnippetEditor snippet={snippet} isEditing={true} />
}