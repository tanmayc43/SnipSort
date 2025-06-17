import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { 
  Copy, 
  Edit, 
  Trash2, 
  Star, 
  StarOff, 
  Folder, 
  Users,
  MoreVertical
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'

export default function SnippetCard({ snippet, onDelete, onToggleFavorite }) {
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)

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
      setIsDeleting(true)
      try {
        await onDelete(snippet.id)
        toast({
          title: "Snippet deleted",
          description: "The snippet has been successfully deleted.",
        })
      } catch (error) {
        toast({
          title: "Failed to delete",
          description: "Could not delete the snippet. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleToggleFavorite = async () => {
    try {
      await onToggleFavorite(snippet.id, !snippet.is_favorite)
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getOrganizationInfo = () => {
    if (snippet.folders) {
      return {
        name: snippet.folders.name,
        color: snippet.folders.color,
        icon: Folder,
        type: 'folder'
      }
    }
    if (snippet.projects) {
      return {
        name: snippet.projects.name,
        color: snippet.projects.color,
        icon: Users,
        type: 'project'
      }
    }
    return null
  }

  const organizationInfo = getOrganizationInfo()

  return (
    <div className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <Link 
            to={`/dashboard/snippet/${snippet.id}`}
            className="block"
          >
            <h3 className="font-semibold text-foreground hover:text-primary transition-colors truncate">
              {snippet.title}
            </h3>
          </Link>
          {snippet.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {snippet.description}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-1 ml-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleFavorite}
            className="h-8 w-8"
          >
            {snippet.is_favorite ? (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Code
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/dashboard/snippet/${snippet.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span className="bg-muted px-2 py-1 rounded text-xs font-medium">
            {snippet.language}
          </span>
          
          {organizationInfo && (
            <div className="flex items-center space-x-1">
              <organizationInfo.icon className="h-3 w-3" />
              <span className="text-xs">{organizationInfo.name}</span>
            </div>
          )}
        </div>

        <span className="text-xs">
          {formatDate(snippet.updated_at)}
        </span>
      </div>

      {snippet.snippet_tags && snippet.snippet_tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {snippet.snippet_tags.slice(0, 3).map((tagObj, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
            >
              {tagObj.tag}
            </span>
          ))}
          {snippet.snippet_tags.length > 3 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
              +{snippet.snippet_tags.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}