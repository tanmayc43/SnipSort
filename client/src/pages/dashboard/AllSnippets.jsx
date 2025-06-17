import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import SnippetCard from '@/components/snippets/SnippetCard'
import { snippetService, LANGUAGES } from '@/lib/supabase'
import { UserAuth } from '@/context/AuthContext'
import { Plus, Search, Filter } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function AllSnippets() {
  const { session } = UserAuth()
  const { toast } = useToast()
  const [snippets, setSnippets] = useState([])
  const [filteredSnippets, setFilteredSnippets] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [sortBy, setSortBy] = useState('updated_at')

  useEffect(() => {
    loadSnippets()
  }, [])

  useEffect(() => {
    filterAndSortSnippets()
  }, [snippets, searchQuery, languageFilter, sortBy])

  const loadSnippets = async () => {
    try {
      const data = await snippetService.getSnippets(session.user.id)
      setSnippets(data)
    } catch (error) {
      console.error('Error loading snippets:', error)
      toast({
        title: "Error",
        description: "Failed to load snippets. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortSnippets = () => {
    let filtered = [...snippets]

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(snippet =>
        snippet.title.toLowerCase().includes(query) ||
        snippet.description.toLowerCase().includes(query) ||
        snippet.code.toLowerCase().includes(query) ||
        snippet.snippet_tags?.some(tag => tag.tag.toLowerCase().includes(query))
      )
    }

    // Language filter
    if (languageFilter !== 'all') {
      filtered = filtered.filter(snippet => snippet.language === languageFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'language':
          return a.language.localeCompare(b.language)
        case 'created_at':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'updated_at':
        default:
          return new Date(b.updated_at) - new Date(a.updated_at)
      }
    })

    setFilteredSnippets(filtered)
  }

  const handleDeleteSnippet = async (snippetId) => {
    await snippetService.deleteSnippet(snippetId)
    setSnippets(prev => prev.filter(s => s.id !== snippetId))
  }

  const handleToggleFavorite = async (snippetId, isFavorite) => {
    await snippetService.updateSnippet(snippetId, { is_favorite: isFavorite })
    setSnippets(prev => prev.map(s => 
      s.id === snippetId ? { ...s, is_favorite: isFavorite } : s
    ))
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-lg"></div>
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
          <h1 className="text-2xl font-bold">All Snippets</h1>
          <p className="text-muted-foreground">
            {filteredSnippets.length} of {snippets.length} snippets
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/snippet/new">
            <Plus className="h-4 w-4 mr-2" />
            New Snippet
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search snippets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={languageFilter} onValueChange={setLanguageFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated_at">Last Updated</SelectItem>
            <SelectItem value="created_at">Date Created</SelectItem>
            <SelectItem value="title">Title</SelectItem>
            <SelectItem value="language">Language</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Snippets Grid */}
      {filteredSnippets.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {searchQuery || languageFilter !== 'all' ? 'No snippets found' : 'No snippets yet'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || languageFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first code snippet to get started'
            }
          </p>
          {!searchQuery && languageFilter === 'all' && (
            <Button asChild>
              <Link to="/dashboard/snippet/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Snippet
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSnippets.map((snippet) => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              onDelete={handleDeleteSnippet}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  )
}