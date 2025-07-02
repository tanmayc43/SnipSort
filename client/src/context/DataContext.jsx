import { createContext, useContext, useReducer, useCallback } from 'react';
import { toast } from 'sonner';

const DataContext = createContext();

// Action types
const DATA_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_DATA: 'SET_DATA',
  SET_ERROR: 'SET_ERROR',
  UPDATE_ITEM: 'UPDATE_ITEM',
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  CLEAR_CACHE: 'CLEAR_CACHE'
};

// Initial state
const initialState = {
  snippets: { data: [], loading: false, error: null, lastFetch: null },
  folders: { data: [], loading: false, error: null, lastFetch: null },
  projects: { data: [], loading: false, error: null, lastFetch: null }
};

// Reducer
const dataReducer = (state, action) => {
  const { type, payload } = action;
  
  switch (type) {
    case DATA_ACTIONS.SET_LOADING:
      return {
        ...state,
        [payload.resource]: {
          ...state[payload.resource],
          loading: payload.loading
        }
      };
      
    case DATA_ACTIONS.SET_DATA:
      return {
        ...state,
        [payload.resource]: {
          ...state[payload.resource],
          data: payload.data,
          loading: false,
          error: null,
          lastFetch: Date.now()
        }
      };
      
    case DATA_ACTIONS.SET_ERROR:
      return {
        ...state,
        [payload.resource]: {
          ...state[payload.resource],
          error: payload.error,
          loading: false
        }
      };
      
    case DATA_ACTIONS.UPDATE_ITEM:
      return {
        ...state,
        [payload.resource]: {
          ...state[payload.resource],
          data: state[payload.resource].data.map(item =>
            item.id === payload.id ? { ...item, ...payload.updates } : item
          )
        }
      };
      
    case DATA_ACTIONS.ADD_ITEM:
      return {
        ...state,
        [payload.resource]: {
          ...state[payload.resource],
          data: [payload.item, ...state[payload.resource].data]
        }
      };
      
    case DATA_ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        [payload.resource]: {
          ...state[payload.resource],
          data: state[payload.resource].data.filter(item => item.id !== payload.id)
        }
      };
      
    case DATA_ACTIONS.CLEAR_CACHE:
      return payload.resource ? {
        ...state,
        [payload.resource]: initialState[payload.resource]
      } : initialState;
      
    default:
      return state;
  }
};

export const DataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  // Generic data operations
  const setLoading = useCallback((resource, loading) => {
    dispatch({
      type: DATA_ACTIONS.SET_LOADING,
      payload: { resource, loading }
    });
  }, []);

  const setData = useCallback((resource, data) => {
    dispatch({
      type: DATA_ACTIONS.SET_DATA,
      payload: { resource, data }
    });
  }, []);

  const setError = useCallback((resource, error) => {
    dispatch({
      type: DATA_ACTIONS.SET_ERROR,
      payload: { resource, error }
    });
    
    // Show error toast
    toast.error(`Error loading ${resource}`, {
      description: error.message || 'Something went wrong'
    });
  }, []);

  const updateItem = useCallback((resource, id, updates) => {
    dispatch({
      type: DATA_ACTIONS.UPDATE_ITEM,
      payload: { resource, id, updates }
    });
  }, []);

  const addItem = useCallback((resource, item) => {
    dispatch({
      type: DATA_ACTIONS.ADD_ITEM,
      payload: { resource, item }
    });
  }, []);

  const removeItem = useCallback((resource, id) => {
    dispatch({
      type: DATA_ACTIONS.REMOVE_ITEM,
      payload: { resource, id }
    });
  }, []);

  const clearCache = useCallback((resource = null) => {
    dispatch({
      type: DATA_ACTIONS.CLEAR_CACHE,
      payload: { resource }
    });
  }, []);

  // Optimistic updates
  const optimisticUpdate = useCallback(async (resource, operation, optimisticData, apiCall) => {
    try {
      // Apply optimistic update
      if (operation === 'update') {
        updateItem(resource, optimisticData.id, optimisticData.updates);
      } else if (operation === 'add') {
        addItem(resource, optimisticData.item);
      } else if (operation === 'remove') {
        removeItem(resource, optimisticData.id);
      }

      // Make API call
      const result = await apiCall();
      
      // Update with real data if needed
      if (operation === 'add' && result) {
        updateItem(resource, optimisticData.item.id, result);
      }
      
      return result;
    } catch (error) {
      // Revert optimistic update on error
      if (operation === 'update') {
        updateItem(resource, optimisticData.id, optimisticData.originalData);
      } else if (operation === 'add') {
        removeItem(resource, optimisticData.item.id);
      } else if (operation === 'remove') {
        addItem(resource, optimisticData.originalItem);
      }
      
      throw error;
    }
  }, [updateItem, addItem, removeItem]);

  const value = {
    state,
    setLoading,
    setData,
    setError,
    updateItem,
    addItem,
    removeItem,
    clearCache,
    optimisticUpdate
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Resource-specific hooks
export const useSnippets = () => {
  const { state, ...actions } = useData();
  return {
    snippets: state.snippets,
    ...actions
  };
};

export const useFolders = () => {
  const { state, ...actions } = useData();
  return {
    folders: state.folders,
    ...actions
  };
};

export const useProjects = () => {
  const { state, ...actions } = useData();
  return {
    projects: state.projects,
    ...actions
  };
};