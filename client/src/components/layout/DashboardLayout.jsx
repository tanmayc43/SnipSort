import { useState, useEffect, useRef } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToggleButton } from '@/components/ToggleButton'
import { UserAuth } from '@/context/AuthContext'
import { 
  Search, 
  Plus, 
  Code2, 
  Folder, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function DashboardLayout() {
  const { session, signOutUser } = UserAuth()
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const stored = localStorage.getItem('sidebarOpen');
    return stored === null ? true : stored === 'true';
  })
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const sidebarRef = useRef(null)

  const handleSignOut = async () => {
    try {
      await signOutUser()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleSidebarLinkClick = () => {
    if (window.innerWidth < 1024) setSidebarOpen(false)
  }

  const sidebarItems = [
    { 
      name: 'All Snippets', 
      href: '/dashboard/snippets', 
      icon: Code2,
      active: location.pathname === '/dashboard/snippets' || location.pathname === '/dashboard'
    },
    { 
      name: 'Folders', 
      href: '/dashboard/folders', 
      icon: Folder,
      active: location.pathname.startsWith('/dashboard/folders')
    },
    { 
      name: 'Projects', 
      href: '/dashboard/projects', 
      icon: Users,
      active: location.pathname.startsWith('/dashboard/projects')
    },
  ]

  useEffect(() => {
    localStorage.setItem('sidebarOpen', sidebarOpen);
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && window.innerWidth < 1024 && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      {sidebarOpen && (
        <div
          ref={sidebarRef}
          className={`
            bg-card border-r transition-transform duration-200 ease-in-out
            w-64
            fixed inset-y-0 left-0 z-50
            lg:static lg:z-auto lg:translate-x-0
            ${sidebarOpen && window.innerWidth < 1024 ? 'translate-x-0' : window.innerWidth < 1024 ? '-translate-x-full' : ''}
          `}
          style={{ minWidth: '16rem' }}
        >
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <Link to="/dashboard" className="flex items-center space-x-2" onClick={handleSidebarLinkClick}>
              <Code2 className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">SnipSort</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {sidebarItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${item.active 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }
                `}
                onClick={handleSidebarLinkClick}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => { handleSidebarLinkClick(); navigate('/dashboard/snippet/new') }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Snippet
            </Button>
          </div>
        </div>
      )}
      {/* Main content */}
      <div className="flex-1 flex flex-col transition-all duration-200">
        {/* Top navbar */}
        <header className="h-16 bg-background border-b flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              className="block"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search snippets..."
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>
          <div className="flex items-center space-x-4">
            <ToggleButton />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                    {session?.user?.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{session?.user?.email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}