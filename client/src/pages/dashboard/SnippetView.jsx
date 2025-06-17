import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { 
  Copy, 
  Edit, 
  Trash2, 
  Star, 
  StarOff, 
  ArrowLeft,
  Calendar,
  Folder,
  Users
} from 'lucide-react'
import { snippetService } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import MonacoEditor from '@monaco-editor/react'
import { useTheme } from '@/components/theme-provider'

export default function SnippetView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { toast } = useToast()
  const [snippet, setSnippet] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSnippet()
  }, [id])

  const loadSnippet = async () => {
    try {
      const data = await snippetService.getSnippet(id)
      setSnippet(data)
    } catch (error) {
      console.error('Error loading snippet:', error)
      toast({
        title: "Error",
        description: "Failed to load snippet. Please try again.",
        variant: "destructive",
      })
      navigate('/dashboard/snippets')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code)
      toast({
        title: "Copied to clipboard",
        description: "Code snippet has been copied to your clipboard.",
      })
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy code to clipboard.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this snippet?')) {
      try {
        await snippetService.deleteSnippet(snippet.id)
        toast({
          title: "Snippet deleted",
          description: "The snippet has been successfully deleted.",
        })
        navigate('/dashboard/snippets')
      } catch (error) {
        toast({
          title: "Failed to delete",
          description: "Could not delete the snippet. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const handleToggleFavorite = async () => {
    try {
      const updatedSnippet = await snippetService.updateSnippet(snippet.id, {
        is_favorite: !snippet.is_favorite
      })
      setSnippet(prev => ({ ...prev, is_favorite: updatedSnippet.is_favorite }))
      toast({
        title: snippet.is_favorite ? "Removed from favorites" : "Added to favorites",
        description: `Snippet has been ${snippet.is_favorite ? 'removed from' : 'added to'} your favorites.`,
      })
    } catch (error) {
      toast({
        title: "Failed to update",
        description: "Could not update favorite status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getOrganizationInfo = () => {
    if (snippet.folders) {
      return {
        name: snippet.folders.name,
        color: snippet.folders.color,
        icon: Folder,
        type: 'folder',
        link: `/dashboard/folders/${snippet.folder_id}`
      }
    }
    if (snippet.projects) {
      return {
        name: snippet.projects.name,
        color: snippet.projects.color,
        icon: Users,
        type: 'project',
        link: `/dashboard/projects/${snippet.project_id}`
      }
    }
    return null
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (!snippet) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Snippet not found</h1>
        <Button onClick={() => navigate('/dashboard/snippets')}>
          Back to Snippets
        </Button>
      </div>
    )
  }

  const organizationInfo = getOrganizationInfo()

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{snippet.title}</h1>
            {snippet.description && (
              <p className="text-muted-foreground mt-1">{snippet.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleToggleFavorite}
          >
            {snippet.is_favorite ? (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </Button>
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" asChild>
            <Link to={`/dashboard/snippet/${snippet.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          <span className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium">
            {snippet.language}
          </span>
        </div>

        {organizationInfo && (
          <Link 
            to={organizationInfo.link}
            className="flex items-center space-x-1 hover:text-foreground transition-colors"
          >
            <organizationInfo.icon className="h-4 w-4" />
            <span>{organizationInfo.name}</span>
          </Link>
        )}

        <div className="flex items-center space-x-1">
          <Calendar className="h-4 w-4" />
          <span>Updated {formatDate(snippet.updated_at)}</span>
        </div>
      </div>

      {/* Tags */}
      {snippet.snippet_tags && snippet.snippet_tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {snippet.snippet_tags.map((tagObj, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-secondary text-secondary-foreground"
            >
              {tagObj.tag}
            </span>
          ))}
        </div>
      )}

      {/* Code Editor */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
          <span className="text-sm font-medium">{snippet.title}</span>
          <span className="text-xs text-muted-foreground">{snippet.language}</span>
        </div>
        <MonacoEditor
          height="500px"
          language={snippet.language}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          value={snippet.code}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  )
}