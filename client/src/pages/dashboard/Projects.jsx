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
import { projectApi, snippetApi } from '@/lib/api'
import { UserAuth } from '@/context/AuthContext'
import { Plus, Users, Edit, Trash2, MoreVertical, Crown, ArrowLeft, Code, UserPlus, Shield, User } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import SnippetCard from '@/components/snippets/SnippetCard'

export default function Projects() {
  const { session } = UserAuth()
  const { id: projectId } = useParams()
  const navigate = useNavigate()
  
  console.log('Projects component rendered:', { 
    projectId, 
    hasSession: !!session, 
    userId: session?.user?.id,
    token: session?.access_token ? 'present' : 'missing',
    sessionKeys: session ? Object.keys(session) : [],
    userKeys: session?.user ? Object.keys(session.user) : []
  })
  
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [projectSnippets, setProjectSnippets] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#10B981',
    is_public: false
  })
  
  // Member management state
  const [membersDialogOpen, setMembersDialogOpen] = useState(false)
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false)
  const [newMemberData, setNewMemberData] = useState({
    email: '',
    role: 'member'
  })

  useEffect(() => {
    console.log('Projects useEffect triggered:', { projectId, hasCurrentProject: !!currentProject })
    if (projectId) {
      loadProjectDetails()
    } else {
      loadProjects()
    }
  }, [projectId])

  // Add focus event listener to refresh data when user returns to the page
  useEffect(() => {
    const handleFocus = () => {
      if (projectId && !isDeleting) {
        loadProjectDetails()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [projectId, isDeleting])

  // Also refresh when the component becomes visible (for mobile/background tabs)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && projectId && !isDeleting) {
        loadProjectDetails()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [projectId, isDeleting])

  const loadProjects = async () => {
    try {
      const data = await projectApi.getAll(session?.access_token)
      setProjects(data)
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error('Error loading projects', { description: 'Failed to load projects. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const loadProjectDetails = async () => {
    try {
      setLoading(true)
      console.log('Loading project details for projectId:', projectId)
      
      const [projectData, snippetsData] = await Promise.all([
        projectApi.getById(projectId, session?.access_token),
        snippetApi.getByProject(projectId)
      ])
      
      console.log('Project data:', projectData)
      console.log('Project members:', projectData.members)
      console.log('Snippets for this project:', snippetsData)
      
      setCurrentProject(projectData)
      setProjectSnippets(snippetsData)
    } catch (error) {
      console.error('Error loading project details:', error)
      toast.error('Error loading project', { description: 'Failed to load project details. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Validation Error', { description: 'Project name is required.' })
      return
    }

    try {
      const projectData = {
        name: formData.name,
        description: formData.description,
        color: formData.color,
        is_public: formData.is_public
      }

      if (editingProject) {
        const updatedProject = await projectApi.update(editingProject.id, projectData, session?.access_token)
        setProjects(prev => prev.map(p => p.id === editingProject.id ? updatedProject : p))
        if (currentProject && currentProject.id === editingProject.id) {
          setCurrentProject(updatedProject)
        }
        toast.success('Project updated', { description: 'Your project has been updated successfully.' })
      } else {
        const newProject = await projectApi.create(projectData, session?.access_token)
        setProjects(prev => [...prev, newProject])
        toast.success('Project created', { description: 'Your project has been created successfully.' })
      }

      setDialogOpen(false)
      setEditingProject(null)
      setFormData({ name: '', description: '', color: '#10B981', is_public: false })
    } catch (error) {
      console.error('Error saving project:', error)
      toast.error('Error saving project', { description: `Failed to ${editingProject ? 'update' : 'create'} project. Please try again.` })
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
        setIsDeleting(true)
        await projectApi.delete(projectId, session?.access_token)
        setProjects(prev => prev.filter(p => p.id !== projectId))
        if (currentProject && currentProject.id === projectId) {
          navigate('/dashboard/projects')
        }
        toast.success('Project deleted', { description: 'The project has been successfully deleted.' })
      } catch (error) {
        console.error('Error deleting project:', error)
        toast.error('Failed to delete', { description: 'Could not delete the project. Please try again.' })
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const openCreateDialog = () => {
    setEditingProject(null)
    setFormData({ name: '', description: '', color: '#10B981', is_public: false })
    setDialogOpen(true)
  }

  const isOwner = (project) => {
    if (!session || !session.user) return false;
    return project.owner_id === session.user.id;
  }

  const getUserRole = (project) => {
    if (!session || !session.user) return null;
    const members = project.members || project.project_members || [];
    const member = members.find(m => m.userId === session.user.id || m.user_id === session.user.id);
    return member?.role || 'member';
  }

  const canManageProject = (project) => {
    const role = getUserRole(project);
    return role === 'owner' || role === 'admin';
  }

  const canManageMembers = (project) => {
    const role = getUserRole(project);
    return role === 'owner' || role === 'admin';
  }

  const canEditSnippets = (project) => {
    const role = getUserRole(project);
    return role === 'owner' || role === 'admin';
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!newMemberData.email.trim()) {
      toast.error('Validation Error', { description: 'Email is required.' })
      return
    }

    try {
      await projectApi.addMember(projectId, newMemberData.email, newMemberData.role, session?.access_token)
      setAddMemberDialogOpen(false)
      setNewMemberData({ email: '', role: 'member' })
      loadProjectDetails() // Refresh to get updated member list
      toast.success('Member added', { description: 'The member has been added to the project successfully.' })
    } catch (error) {
      console.error('Error adding member:', error)
      toast.error('Failed to add member', { description: error.message || 'Could not add member to the project.' })
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (window.confirm('Are you sure you want to remove this member from the project?')) {
      try {
        await projectApi.removeMember(projectId, memberId, session?.access_token)
        loadProjectDetails() // Refresh to get updated member list
        toast.success('Member removed', { description: 'The member has been removed from the project.' })
      } catch (error) {
        console.error('Error removing member:', error)
        toast.error('Failed to remove member', { description: error.message || 'Could not remove member from the project.' })
      }
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />
      case 'member':
        return <User className="h-4 w-4 text-gray-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'owner':
        return 'Owner'
      case 'admin':
        return 'Admin'
      case 'member':
        return 'Member'
      default:
        return 'Member'
    }
  }

  const canRemoveMember = (currentUserRole, targetRole, currentUserId, targetUserId) => {
    if (currentUserId === targetUserId) return false; // cannot remove self
    if(currentUserRole === 'owner'){
      return targetRole !== 'owner'; // owner can remove admins and members
    }
    if(currentUserRole === 'admin'){
      return targetRole === 'member'; // admin can only remove members
    }
    return false; // members cannot remove anyone
  }

  // Project Detail View
  if (projectId && currentProject) {
    console.log('Rendering project detail view for:', projectId, currentProject)
    return (
      <div className="p-6">
        {/* Back button row */}
        <div className="mb-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
        {/* Project header row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex flex-nowrap items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ backgroundColor: currentProject.color }} />
            <h1 className="text-2xl font-bold truncate max-w-[120px] sm:max-w-xs">{currentProject.name}</h1>
            {canManageProject(currentProject) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="ml-1 flex-shrink-0">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEdit(currentProject)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Project
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDelete(currentProject.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2 flex-shrink-0 mt-2 sm:mt-0">
            {canManageMembers(currentProject) && (
              <Button variant="outline" onClick={() => setMembersDialogOpen(true)}>
                <Users className="h-4 w-4 mr-2" />
                Members
              </Button>
            )}
          </div>
        </div>
        {/* Project description and role */}
        <div className="mb-6">
          {currentProject.description && (
            <p className="text-muted-foreground mb-1">{currentProject.description}</p>
          )}
          <div className="flex items-center gap-2">
            {getRoleIcon(currentProject.role)}
            <span className="text-sm text-muted-foreground">
              {getRoleLabel(currentProject.role)}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2" style={{ gridAutoRows: '260px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : projectSnippets.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
              <Code className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No snippets in this project</h3>
            <p className="text-muted-foreground mb-4">
              {canEditSnippets(currentProject) 
                ? 'Create your first snippet in this project'
                : 'No snippets have been added to this project yet'
              }
            </p>
            {canEditSnippets(currentProject) && (
              <Button asChild>
                <Link 
                  to="/dashboard/snippet/new" 
                  state={{ projectId: currentProject.id, projectName: currentProject.name }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Snippet
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2" style={{ gridAutoRows: '260px' }}>
            {projectSnippets.map((snippet) => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                onDelete={canEditSnippets(currentProject) ? async (snippetId) => {
                  try {
                    await snippetApi.delete(snippetId)
                    setProjectSnippets(prev => prev.filter(s => s.id !== snippetId))
                  } catch (error) {
                    throw error
                  }
                } : undefined}
                onToggleFavorite={canEditSnippets(currentProject) ? async (snippetId, isCurrentlyFavorite) => {
                  try {
                    const updatedSnippet = await snippetApi.update(snippetId, { is_favorite: !isCurrentlyFavorite })
                    setProjectSnippets(prev => prev.map(s => (s.id === snippetId ? updatedSnippet : s)))
                  } catch (error) {
                    throw error
                  }
                } : undefined}
                readOnly={!canEditSnippets(currentProject)}
              />
            ))}
          </div>
        )}

        {/* Members Dialog */}
        <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Project Members</DialogTitle>
              <DialogDescription>
                Manage who has access to this project and their roles.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Current Members</h3>
                {canManageMembers(currentProject) && (
                  <Button onClick={() => setAddMemberDialogOpen(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                )}
              </div>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {(currentProject.members || []).map((member) => (
                  <div key={member.userId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getRoleIcon(member.role)}
                      <div>
                        <p className="font-medium">{member.fullName || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {getRoleLabel(member.role)}
                      </span>
                      {canRemoveMember(
                        getUserRole(currentProject),
                        member.role,
                        session.user.id,
                        member.userId
                      ) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.userId)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {(currentProject.members || []).length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    No members found
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Member Dialog */}
        <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Member</DialogTitle>
              <DialogDescription>
                Invite a new member to this project by their email address.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddMember}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newMemberData.email}
                    onChange={(e) => setNewMemberData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newMemberData.role}
                    onValueChange={(value) => setNewMemberData(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member (View only)</SelectItem>
                      <SelectItem value="admin">Admin (Manage members & edit)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setAddMemberDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Add Member
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Project Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                {/* <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={formData.is_public}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="is_public">Make this project public</Label>
                </div> */}
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
    )
  }

  // Show loading state when we have a projectId but no currentProject yet
  if (projectId && !currentProject && loading) {
    console.log('Loading project details...')
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2" style={{ gridAutoRows: '260px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Show error state when we have a projectId but failed to load
  if (projectId && !currentProject && !loading) {
    console.log('Failed to load project details, showing error state')
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Project not found</h3>
          <p className="text-muted-foreground mb-4">
            The project you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate('/dashboard/projects')}>
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  // Project List View
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2" style={{ gridAutoRows: '260px' }}>
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
                  <Label htmlFor="is_public">Make this project public</Label>
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
            Create your first project to collaborate with others
          </p>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
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
                      <h3 className="font-semibold text-foreground hover:text-primary transition-colors truncate">
                        {project.name}
                      </h3>
                    </Link>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      {getRoleIcon(project.role)}
                      <span className="text-xs text-muted-foreground">
                        {getRoleLabel(project.role)}
                      </span>
                    </div>
                  </div>
                </div>

                {canManageProject(project) && (
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

              <div className="text-sm text-muted-foreground">
                Created {new Date(project.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}