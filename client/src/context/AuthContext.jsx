import { createContext, useEffect, useState, useContext } from 'react';
import { authApi } from '../lib/api';

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => { 
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const signUpUser = async (email, password) => {
        try {
            const result = await authApi.register(email, password);
            if (result.success) {
                setUser(result.data.user);
                return { success: true, data: result.data };
            }
            return { success: false, error: result.error };
        } catch (error) {
            console.error("Error signing up:", error);
            return { success: false, error: error.message };
        }
    }

    const signInUser = async (email, password) => {
        try {
            const result = await authApi.login(email, password);
            if (result.success) {
                setUser(result.data.user);
                return { success: true, data: result.data };
            }
            return { success: false, error: result.error };
        } catch (error) {
            console.error("Error signing in:", error);
            return { success: false, error: error.message };
        }
    }

    const signInWithGoogle = async () => {
        // Google OAuth would need to be implemented separately
        // For now, return an error
        return { success: false, error: "Google sign-in not implemented yet" };
    }

    const signOutUser = async () => {
        try {
            authApi.logout();
            setUser(null);
        } catch (error) {
            console.error("Error signing out:", error);
            throw error;
        }
    }

    // Check if user is authenticated on app load
    useEffect(() => {
        const checkAuth = () => {
            const token = authApi.getToken();
            if (token) {
                // In a real app, you'd validate the token with the server
                // For now, we'll assume it's valid if it exists
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    if (payload.exp * 1000 > Date.now()) {
                        // Token is still valid
                        setUser({ id: payload.userId });
                    } else {
                        // Token expired
                        authApi.logout();
                    }
                } catch (error) {
                    // Invalid token
                    authApi.logout();
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    // Create session object for compatibility with existing code
    const session = user ? { user } : null;

    return(
        <AuthContext.Provider value={{
            session, 
            loading,
            signInUser, 
            signUpUser, 
            signInWithGoogle,
            signOutUser
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const UserAuth = () => {
    return useContext(AuthContext);
};