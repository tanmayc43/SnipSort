const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// token and user Management 

const saveToken = (token) => {
  localStorage.setItem('token', token);
};

const saveUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

const getToken = () => {
  // try and get token from localStorage first
  const localToken = localStorage.getItem('token');
  if(localToken){
    return localToken;
  }
  
  // If no localStorage token, try to get from session (for Supabase auth)
  // This will be set by the auth context
  return null;
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};


// API Request Function

const apiRequest = async (method, path, data, sessionToken = null) => {
  try {
    let token = sessionToken;
    
    // If no session token provided, try to get from localStorage
    if (!token) {
      token = getToken();
    }
    
    const headers = {
      'Content-Type': 'application/json',
    };

    // **FIX**: If a token exists, add it to the Authorization header
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${path}`, options);
    
    // Check if response has content before trying to parse JSON
    let responseData;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      // For empty responses (like 204 No Content), set responseData to null
      responseData = null;
    }

    if (!response.ok) {
      // Throw an error object that includes the message from the server
      throw new Error(responseData?.message || `Request failed with status ${response.status}`);
    }

    return responseData;
  } catch (error) {
    console.error(`API request error: ${method} ${path}`, error);
    // Re-throw the error so the calling function can handle it
    throw error;
  }
};

// --- API Endpoints ---

export const authApi = {
  register: async (email, password, fullName) => {
    const data = { email, password, fullName };
    const result = await apiRequest('POST', '/api/auth/register', data);
    // **FIX**: Save token and user on successful registration
    if (result.token) {
      saveToken(result.token);
      saveUser(result.user);
    }
    return result;
  },
  login: async (email, password) => {
    const data = { email, password };
    const result = await apiRequest('POST', '/api/auth/login', data);
    // **FIX**: Save token and user on successful login
    if (result.token) {
      saveToken(result.token);
      saveUser(result.user);
    }
    return result;
  },
  logout: logout, // Expose the logout function
  getToken: getToken, // Expose the getToken function
};

// functional api's for folders, projects, and snippets
export const folderApi = {
  getAll: () => apiRequest('GET', '/api/folders'),
  getById: (id) => apiRequest('GET', `/api/folders/${id}`),
  create: (data) => apiRequest('POST', '/api/folders', data),
  update: (id, data) => apiRequest('PUT', `/api/folders/${id}`, data),
  delete: (id) => apiRequest('DELETE', `/api/folders/${id}`),
};

export const projectApi = {
  getAll: () => apiRequest('GET', '/api/projects'),
  getById: (id) => apiRequest('GET', `/api/projects/${id}`),
  create: (data) => apiRequest('POST', '/api/projects', data),
  update: (id, data) => apiRequest('PUT', `/api/projects/${id}`, data),
  delete: (id) => apiRequest('DELETE', `/api/projects/${id}`),
  addMember: (projectId, email, role) => apiRequest('POST', `/api/projects/${projectId}/members`, { email, role }),
  removeMember: (projectId, memberId) => apiRequest('DELETE', `/api/projects/${projectId}/members/${memberId}`),
};

export const snippetApi = {
  getAll: () => apiRequest('GET', '/api/snippets'),
  getById: (id) => apiRequest('GET', `/api/snippets/${id}`),
  getByFolder: (folderId) => apiRequest('GET', `/api/snippets?folder_id=${folderId}`),
  getByProject: (projectId) => apiRequest('GET', `/api/snippets?project_id=${projectId}`),
  create: (data) => apiRequest('POST', '/api/snippets', data),
  update: (id, data) => apiRequest('PUT', `/api/snippets/${id}`, data),
  delete: (id) => apiRequest('DELETE', `/api/snippets/${id}`),
  removeFromFolder: (id) => apiRequest('PATCH', `/api/snippets/${id}/remove-from-folder`),
};