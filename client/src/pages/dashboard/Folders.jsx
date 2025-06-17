import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
import { folderService } from '@/lib/supabase'
import { UserAuth } from '@/context/AuthContext'
import { Plus, Folder, Edit, Trash2, MoreVertical } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Folders() {
  const { session } = UserAuth()
  const { toast } = useToast()
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  })

  useEffect(() => {
    loadFolders()
  }, [])

  const loadFolders = async () => {
    try {
      const data = await folderService.getFolders(session.user.id)
      setFolders(data)
    } catch (error) {
      console.error('Error loading folders:', error)
      toast({
        title: "Error",
        description: "Failed to load folders. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Folder name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      const folderData = {
        ...formData,
        user_id: session.user.id
      }

      if (editingFolder) {
        const updatedFolder = await folderService.updateFolder(editingFolder.id, folderData)
        setFolders(prev => prev.map(f => f.id === editingFolder.id ? updatedFolder : f))
        toast({
          title: "Folder updated",
          description: "Your folder has been updated successfully.",
        })
      } else {
        const newFolder = await folderService.createFolder(folderData)
        setFolders(prev => [...prev, newFolder])
        toast({
          title: "Folder created",
          description: "Your folder has been created successfully.",
        })
      }

      setDialogOpen(false)
      setEditingFolder(null)
      setFormData({ name: '', description: '', color: '#3B82F6' })
    } catch (error) {
      console.error('Error saving folder:', error)
      toast({
        title: "Error",
        description: `Failed to ${editingFolder ? 'update' : 'create'} folder. Please try again.`,
        variant: "destructive",
      })
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
    if (window.confirm('Are you sure you want to delete this folder? All snippets in this folder will be moved to "Uncategorized".')) {
      try {
        await folderService.deleteFolder(folderId)
        setFolders(prev => prev.filter(f => f.id !== folderId))
        toast({
          title: "Folder deleted",
          description: "The folder has been successfully deleted.",
        })
      } catch (error) {
        console.error('Error deleting folder:', error)
        toast({
          title: "Failed to delete",
          description: "Could not delete the folder. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const openCreateDialog = () => {
    setEditingFolder(null)
    setFormData({ name: '', description: '', color: '#3B82F6' })
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-lg"></div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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