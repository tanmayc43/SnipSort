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
import { projectService } from '@/lib/supabase'
import { UserAuth } from '@/context/AuthContext'
import { Plus, Users, Edit, Trash2, MoreVertical, Crown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Projects() {
  const { session } = UserAuth()
  const { toast } = useToast()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#10B981',
    is_public: false
  })

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await projectService.getProjects(session.user.id)
      setProjects(data)
    } catch (error) {
      console.error('Error loading projects:', error)
      toast({
        title: "Error",
        description: "Failed to load projects. Please try again.",
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
        description: "Project name is required.",
        variant: "destructive",
      })
      return
    }

    try {
      const projectData = {
        ...formData,
        owner_id: session.user.id
      }

      if (editingProject) {
        const updatedProject = await projectService.updateProject(editingProject.id, projectData)
        setProjects(prev => prev.map(p => p.id === editingProject.id ? updatedProject : p))
        toast({
          title: "Project updated",
          description: "Your project has been updated successfully.",
        })
      } else {
        const newProject = await projectService.createProject(projectData)
        setProjects(prev => [...prev, newProject])
        toast({
          title: "Project created",
          description: "Your project has been created successfully.",
        })
      }

      setDialogOpen(false)
      setEditingProject(null)
      setFormData({ name: '', description: '', color: '#10B981', is_public: false })
    } catch (error) {
      console.error('Error saving project:', error)
      toast({
        title: "Error",
        description: `Failed to ${editingProject ? 'update' : 'create'} project. Please try again.`,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (project) => {
    setEditingProject(project)
    setFormData({
      name: project.name,
      description: project.description || '',
      color: project.color || '#10B981',
      is_public: project.is_public || false
    })
    setDialogOpen(true)
  }

  const handleDelete = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? All snippets in this project will be moved to "Uncategorized".')) {
      try {
        await projectService.deleteProject(projectId)
        setProjects(prev => prev.filter(p => p.id !== projectId))
        toast({
          title: "Project deleted",
          description: "The project has been successfully deleted.",
        })
      } catch (error) {
        console.error('Error deleting project:', error)
        toast({
          title: "Failed to delete",
          description: "Could not delete the project. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  const openCreateDialog = () => {
    setEditingProject(null)
    setFormData({ name: '', description: '', color: '#10B981', is_public: false })
    setDialogOpen(true)
  }

  const isOwner = (project) => {
    return project.owner_id === session.user.id
  }

  const getUserRole = (project) => {
    const member = project.project_members?.find(m => m.user_id === session.user.id)
    return member?.role || 'member'
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
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Collaborate on code snippets with your team
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProject ? 'Edit Project' : 'Create New Project'}
              </DialogTitle>
              <DialogDescription>
                {editingProject 
                  ? 'Update your project details below.'
                  : 'Create a new project to collaborate with others.'
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
                    placeholder="Enter project name"
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
                      placeholder="#10B981"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="is_public">Make project public</Label>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProject ? 'Update' : 'Create'} Project
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first project to start collaborating
          </p>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-card border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/dashboard/projects/${project.id}`}
                      className="block"
                    >
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-foreground hover:text-primary transition-colors truncate">
                          {project.name}
                        </h3>
                        {isOwner(project) && (
                          <Crown className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                    </Link>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                  </div>
                </div>

                {isOwner(project) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(project)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(project.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <span className="capitalize">{getUserRole(project)}</span>
                  {project.is_public && (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      Public
                    </span>
                  )}
                </div>
                <span className="text-xs">
                  Created {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}