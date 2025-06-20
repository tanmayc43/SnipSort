const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

const setAuthToken = (token) => {
  localStorage.setItem('auth_token', token);
};

const removeAuthToken = () => {
  localStorage.removeItem('auth_token');
};

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || 'Request failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 0, { originalError: error });
  }
};

// Auth API
export const authApi = {
  async register(email, password) {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.success && data.data.token) {
      setAuthToken(data.data.token);
    }
    
    return data;
  },

  async login(email, password) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.success && data.data.token) {
      setAuthToken(data.data.token);
    }
    
    return data;
  },

  logout() {
    removeAuthToken();
  },

  getToken() {
    return getAuthToken();
  },

  isAuthenticated() {
    return !!getAuthToken();
  }
};

// Snippets API
export const snippetsApi = {
  async getSnippets(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value);
      }
    });
    
    const queryString = searchParams.toString();
    const endpoint = `/snippets${queryString ? `?${queryString}` : ''}`;
    
    const data = await apiRequest(endpoint);
    return data.data;
  },

  async getSnippet(id) {
    const data = await apiRequest(`/snippets/${id}`);
    return data.data;
  },

  async createSnippet(snippet) {
    const data = await apiRequest('/snippets', {
      method: 'POST',
      body: JSON.stringify(snippet),
    });
    return data.data;
  },

  async updateSnippet(id, updates) {
    const data = await apiRequest(`/snippets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.data;
  },

  async deleteSnippet(id) {
    await apiRequest(`/snippets/${id}`, {
      method: 'DELETE',
    });
  },

  async updateTags(snippetId, tags) {
    await apiRequest(`/snippets/${snippetId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tags }),
    });
  }
};

// Folders API
export const foldersApi = {
  async getFolders() {
    const data = await apiRequest('/folders');
    return data.data;
  },

  async createFolder(folder) {
    const data = await apiRequest('/folders', {
      method: 'POST',
      body: JSON.stringify(folder),
    });
    return data.data;
  },

  async updateFolder(id, updates) {
    const data = await apiRequest(`/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.data;
  },

  async deleteFolder(id) {
    await apiRequest(`/folders/${id}`, {
      method: 'DELETE',
    });
  }
};

// Projects API
export const projectsApi = {
  async getProjects() {
    const data = await apiRequest('/projects');
    return data.data;
  },

  async createProject(project) {
    const data = await apiRequest('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
    return data.data;
  },

  async updateProject(id, updates) {
    const data = await apiRequest(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return data.data;
  },

  async deleteProject(id) {
    await apiRequest(`/projects/${id}`, {
      method: 'DELETE',
    });
  }
};

export { ApiError };