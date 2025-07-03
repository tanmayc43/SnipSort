import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

import SnippetCard from '@/components/snippets/SnippetCard';
import { snippetApi } from '@/lib/api';
import { UserAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { languages } from '@/lib/constants';

export default function AllSnippets() {
  const { session, loading: authLoading } = UserAuth();
  const [snippets, setSnippets] = useState([]);
  const [filteredSnippets, setFilteredSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [languageFilter, setLanguageFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated_at');
  const [page, setPage] = useState(1);
  
  // Fixed layout: 5 snippets per row, 2 rows = 10 snippets per page
  const pageSize = 10;
  const totalPages = Math.ceil(filteredSnippets.length / pageSize);
  const paginatedSnippets = filteredSnippets.slice((page - 1) * pageSize, page * pageSize);

  const loadSnippets = useCallback(async () => {
    // if not authenticated, clear snippets and return
    if(authLoading || !session){
      if(!authLoading){
        setSnippets([]);
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try{
      const data = await snippetApi.getAll();
      setSnippets(data);
    }
    catch(error){
      toast.error('Error loading snippets', { description: error.message });
    }
    finally{
      setLoading(false);
    }
  }, [session, authLoading]);

  useEffect(() => {
    loadSnippets();
  }, [loadSnippets]);

  useEffect(() => {
    let filtered = [...snippets];
    if(searchQuery.trim()){
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(query) ||
        (s.description && s.description.toLowerCase().includes(query)) ||
        (s.tags && s.tags.some(tag => tag.toLowerCase().includes(query)))
      );
    }
    if(languageFilter !== 'all'){
      const selectedLang = languages.find(l => l.name === languageFilter);
      if (selectedLang) {
        filtered = filtered.filter(s => (s.language_slug === selectedLang.slug || s.language_name === selectedLang.name));
      }
    }
    if (showFavoritesOnly) {
      filtered = filtered.filter(s => s.is_favorite);
    }
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title': return a.title.localeCompare(b.title);
        case 'language': return (a.language_name || '').localeCompare(b.language_name || '');
        case 'created_at': return new Date(b.created_at) - new Date(a.created_at);
        case 'updated_at': default: return new Date(b.updated_at) - new Date(a.updated_at);
      }
    });
    setFilteredSnippets(filtered);
  }, [snippets, searchQuery, languageFilter, sortBy, showFavoritesOnly]);

  useEffect(() => {
    setPage(1); // Reset to first page when filters change
  }, [searchQuery, languageFilter, sortBy, showFavoritesOnly]);

  const handleDelete = async (snippetId) => {
    const originalSnippets = snippets;  
    setSnippets(prev => prev.filter(s => s.id !== snippetId)); // optimistic delete
    try{
      await snippetApi.delete(snippetId);
      toast.success('Snippet deleted successfully');
    }
    catch(error){
      toast.error('Error deleting snippet', { description: error.message });
      setSnippets(originalSnippets); // revert to original state
    }
  };

  const handleToggleFavorite = async (snippetId, isCurrentlyFavorite) => {
    const newFavoriteStatus = !isCurrentlyFavorite;
    setSnippets(prev => prev.map(s => (s.id === snippetId ? { ...s, is_favorite: newFavoriteStatus } : s)));
    try{
      // fetch the full snippet to get all required fields
      const full = await snippetApi.getById(snippetId);
      // Defensive tags handling
      let tags = [];
      if (Array.isArray(full.tags)) {
        tags = full.tags;
      } else if (typeof full.tags === 'string') {
        try {
          tags = JSON.parse(full.tags);
          if (!Array.isArray(tags)) tags = [];
        } catch {
          tags = [];
        }
      } else {
        tags = [];
      }
      console.log('full.tags:', full.tags, 'tags:', tags); // Debug log
      const payload = {
        title: full.title,
        code: full.code,
        language_id: full.language_id,
        description: full.description || '',
        is_favorite: newFavoriteStatus,
        is_public: typeof full.is_public === 'boolean' ? full.is_public : false,
        tags,
      };
      if (full.folder_id) payload.folder_id = full.folder_id;
      if (full.project_id) payload.project_id = full.project_id;
      console.log('Outgoing payload:', payload); // Debug log
      await snippetApi.update(snippetId, payload);
      console.log('[DEBUG] API call successful, state updated');
    }
    catch(error){
      console.error('[DEBUG] API call failed, reverting state:', error);
      toast.error('Error updating favorite status', { description: error.message });
      setSnippets(prev => prev.map(s => (s.id === snippetId ? { ...s, is_favorite: isCurrentlyFavorite } : s))); // revert change
    }
  };

  // Callback to update main state when favorite is toggled from SnippetCard
  const onFavoriteToggled = (snippetId, newFavoriteStatus) => {
    console.log('[DEBUG] onFavoriteToggled called with snippetId:', snippetId, 'newFavoriteStatus:', newFavoriteStatus);
    setSnippets(prev => prev.map(s => (s.id === snippetId ? { ...s, is_favorite: newFavoriteStatus } : s)));
  };

  // Generate pagination items with ellipsis for large page counts
  const generatePaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      // Show first page, current page area, and last page with ellipsis
      if (page <= 3) {
        // Near the beginning
        for (let i = 1; i <= 4; i++) {
          items.push(i);
        }
        items.push('...');
        items.push(totalPages);
      } else if (page >= totalPages - 2) {
        // Near the end
        items.push(1);
        items.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          items.push(i);
        }
      } else {
        // In the middle
        items.push(1);
        items.push('...');
        for (let i = page - 1; i <= page + 1; i++) {
          items.push(i);
        }
        items.push('...');
        items.push(totalPages);
      }
    }
    
    return items;
  };

  if(loading || authLoading){
    return(
      <div className="flex flex-col h-full">
        {/* Filter skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
        </div>
        
        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 flex-1">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
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
        <Button
          variant={showFavoritesOnly ? "default" : "outline"}
          className="flex items-center"
          onClick={() => setShowFavoritesOnly((v) => !v)}
          aria-pressed={showFavoritesOnly}
        >
          <Star className={`h-4 w-4 mr-2 ${showFavoritesOnly ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          Favorites
        </Button>
        <Select value={languageFilter} onValueChange={setLanguageFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {languages.map((lang) => (
              <SelectItem key={lang.slug} value={lang.name}>{lang.name}</SelectItem>
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

      {/* Content */}
      {filteredSnippets.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">No Snippets Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || languageFilter !== 'all' || showFavoritesOnly
                ? 'Try adjusting your search or filters.'
                : 'Create your first snippet to get started.'
              }
            </p>
            <Button asChild>
              <Link to="/dashboard/snippet/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Snippet
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Fixed Grid: 5 columns, 2 rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 flex-1">
            {paginatedSnippets.map((snippet) => (
              <div key={snippet.id} className="h-64">
                <SnippetCard
                  snippet={snippet}
                  onDelete={handleDelete}
                  onToggleFavorite={() => handleToggleFavorite(snippet.id, snippet.is_favorite)}
                  onFavoriteToggled={onFavoriteToggled}
                />
              </div>
            ))}
            
            {/* Fill empty slots to maintain grid structure */}
            {Array.from({ length: pageSize - paginatedSnippets.length }).map((_, i) => (
              <div key={`empty-${i}`} className="h-64 invisible" />
            ))}
          </div>

          {/* Pagination and Results - Fixed at bottom */}
          <div className="mt-6 space-y-4">
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page > 1) setPage(page - 1);
                        }}
                        className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {generatePaginationItems().map((item, index) => (
                      <PaginationItem key={index}>
                        {item === '...' ? (
                          <span className="px-3 py-2 text-muted-foreground">...</span>
                        ) : (
                          <PaginationLink
                            href="#"
                            isActive={page === item}
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(item);
                            }}
                            className="cursor-pointer"
                          >
                            {item}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page < totalPages) setPage(page + 1);
                        }}
                        className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}

            {/* Results info */}
            <div className="text-center text-sm text-muted-foreground">
              Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredSnippets.length)} of {filteredSnippets.length} snippets
            </div>
          </div>
        </>
      )}
    </div>
  );
}