import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { folderApi, snippetApi } from '@/lib/api'
import { UserAuth } from '@/context/AuthContext'
import { Plus, Folder, Edit, Trash2, MoreVertical, ArrowLeft, Code } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import SnippetCard from '@/components/snippets/SnippetCard'

export default function Folders() {
  const { session } = UserAuth()
  const { id: folderId } = useParams()
  const navigate = useNavigate()
  const [folders, setFolders] = useState([])
  const [currentFolder, setCurrentFolder] = useState(null)
  const [folderSnippets, setFolderSnippets] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  })

  useEffect(() => {
    if (folderId) {
      loadFolderDetails()
    } else {
      loadFolders()
    }
  }, [folderId])

  // focus event listener to refresh data when user returns to the page
  useEffect(() => {
    const handleFocus = () => {
      if(folderId && !isDeleting){
        loadFolderDetails()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [folderId, isDeleting])

  // also refresh when the component becomes visible (for mobile/background tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if(!document.hidden && folderId && !isDeleting){
        loadFolderDetails()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [folderId, isDeleting])

  const loadFolders = async () => {
    try{
      const data = await folderApi.getAll()
      setFolders(data)
    }
    catch(error){
      console.error('Error loading folders:', error.message)
      toast.error('Error loading folders', { description: 'Failed to load folders. Please try again.' })
    }
    finally{
      setLoading(false)
    }
  }

  const loadFolderDetails = async () => {
    try{
      setLoading(true)
      console.log('Loading folder details for folderId:', folderId)
      
      const [folderData, snippetsData] = await Promise.all([
        folderApi.getById(folderId),
        snippetApi.getByFolder(folderId)
      ])
      
      // console.log('Folder data:', folderData)
      // console.log('Snippets for this folder:', snippetsData)
      
      setCurrentFolder(folderData)
      setFolderSnippets(snippetsData)
    }
    catch(error){
      console.error('Error loading folder details:', error.message)
      toast.error('Error loading folder', { description: 'Failed to load folder details. Please try again.' })
    }
    finally{
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if(!formData.name.trim()){
      toast.error('Validation Error', { description: 'Folder name is required.' })
      return
    }

    try{
      const folderData = {
        name: formData.name,
        description: formData.description,
        color: formData.color
      }

      if(editingFolder){
        const updatedFolder = await folderApi.update(editingFolder.id, folderData)
        setFolders(prev => prev.map(f => f.id === editingFolder.id ? updatedFolder : f))
        if(currentFolder && currentFolder.id === editingFolder.id){
          setCurrentFolder(updatedFolder)
        }
        toast.success('Folder updated', { description: 'Your folder has been updated successfully.' })
      }
      else{
        const newFolder = await folderApi.create(folderData)
        setFolders(prev => [...prev, newFolder])
        toast.success('Folder created', { description: 'Your folder has been created successfully.' })
      }

      setDialogOpen(false)
      setEditingFolder(null)
      setFormData({ name: '', description: '', color: '#3B82F6' })
    }
    catch(error){
      console.error('Error saving folder:', error)
      toast.error('Error saving folder', { description: `Failed to ${editingFolder ? 'update' : 'create'} folder. Please try again.` })
    }
  }

  const handleEdit = (folder) => {
    setEditingFolder(folder)
    setFormData({
      name: folder.name,
      description: folder.description || '',
      color: folder.color || '#3B82F6'
    })
    setDialogOpen(true)
  }

  const handleDelete = async (folderId) => {
    if(window.confirm('Are you sure you want to delete this folder? All snippets in this folder will be moved to "Uncategorized".')){
      try{
        setIsDeleting(true)
        await folderApi.delete(folderId)
        setFolders(prev => prev.filter(f => f.id !== folderId))
        if(currentFolder && currentFolder.id === folderId){
          navigate('/dashboard/folders')
        }
        toast.success('Folder deleted', { description: 'The folder has been successfully deleted.' })
      }
      catch(error){
        console.error('Error deleting folder:', error.message)
        toast.error('Failed to delete', { description: 'Could not delete the folder. Please try again.' })
      }
      finally{
        setIsDeleting(false)
      }
    }
  }

  const openCreateDialog = () => {
    setEditingFolder(null)
    setFormData({ name: '', description: '', color: '#3B82F6' })
    setDialogOpen(true)
  }

  // Permission: Only owner can edit snippets in a folder (customize if you have roles)
  const canEditSnippets = (folder) => {
    if (!session || !session.user || !folder) return false;
    return folder.owner_id === session.user.id;
  }

  // Folder Detail View
  if (folderId && currentFolder) {
    return (
      <div className="p-6">
        {/* Back button row */}
        <div className="mb-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/folders')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Folders
          </Button>
        </div>
        {/* Folder header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mb-6">
          <div className="flex items-center gap-3 mb-2 sm:mb-0">
            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: currentFolder.color }} />
            <h1 className="text-2xl font-bold truncate">{currentFolder.name}</h1>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleEdit(currentFolder)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => handleDelete(currentFolder.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {/* Folder description */}
        {currentFolder.description && (
          <p className="text-muted-foreground mb-6">{currentFolder.description}</p>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2" style={{ gridAutoRows: '260px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : folderSnippets.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Code className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No snippets in this folder</h3>
            <p className="text-muted-foreground mb-4">
              Create your first snippet in this folder
            </p>
            {canEditSnippets(currentFolder) && (
              <Button asChild>
                <Link 
                  to="/dashboard/snippet/new" 
                  state={{ folderId: currentFolder.id, folderName: currentFolder.name }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Snippet
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2" style={{ gridAutoRows: '260px' }}>
            {folderSnippets.map((snippet) => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                onDelete={async (snippetId) => {
                  try {
                    await snippetApi.delete(snippetId)
                    setFolderSnippets(prev => prev.filter(s => s.id !== snippetId))
                  } catch (error) {
                    throw error
                  }
                }}
                onToggleFavorite={async (snippetId, isCurrentlyFavorite) => {
                  try {
                    const updatedSnippet = await snippetApi.update(snippetId, { is_favorite: !isCurrentlyFavorite })
                    setFolderSnippets(prev => prev.map(s => (s.id === snippetId ? updatedSnippet : s)))
                  } catch (error) {
                    throw error
                  }
                }}
                onRemovedFromFolder={() => {
                  toast.success('Snippet removed from folder.');
                  loadFolderDetails();
                }}
              />
            ))}
          </div>
        )}

        {/* Edit Folder Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFolder ? 'Edit Folder' : 'Create New Folder'}
              </DialogTitle>
              <DialogDescription>
                {editingFolder 
                  ? 'Update your folder details below.'
                  : 'Create a new folder to organize your snippets.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter folder name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-12 h-10 rounded border border-input"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingFolder ? 'Update' : 'Create'} Folder
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Folder List View
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Folders</h1>
          <p className="text-muted-foreground">
            Organize your snippets into folders
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFolder ? 'Edit Folder' : 'Create New Folder'}
              </DialogTitle>
              <DialogDescription>
                {editingFolder 
                  ? 'Update your folder details below.'
                  : 'Create a new folder to organize your snippets.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter folder name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description (optional)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      id="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-12 h-10 rounded border border-input"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#3B82F6"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingFolder ? 'Update' : 'Create'} Folder
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {folders.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Folder className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No folders yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first folder to organize your snippets
          </p>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Folder
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: folder.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/dashboard/folders/${folder.id}`}
                      className="block"
                    >
                      <h3 className="font-semibold text-foreground hover:text-primary transition-colors truncate">
                        {folder.name}
                      </h3>
                    </Link>
                    {folder.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {folder.description}
                      </p>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(folder)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDelete(folder.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="text-sm text-muted-foreground">
                Created {new Date(folder.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}