import { createContext, useEffect, useState, useContext } from 'react';
import { authApi } from '../lib/api';

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => { 
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const signUpUser = async (email, password, fullName) => {
        try{
            const result = await authApi.register(email, password, fullName);
            if(result.token){
                setUser(result.user);
                return { success: true, data: result };
            }
            return{ success: false, error: result.message || 'Registration failed.' };
        } 
        // dont print the error stack
        catch(error){
            console.error("Error signing up:", error.message);
            return { success: false, error: error.message };
        }
    }

    const signInUser = async (email, password) => {
        try{
            const result = await authApi.login(email, password);
            if(result.token){
                setUser(result.user);
                return { success: true, data: result };
            }
            return { success: false, error: result.message || 'Login failed.' };
        }
        catch(error){
            console.error("Error signing in:", error.message);
            return { success: false, error: error.message };
        }
    }

    // not implemented yet
    const signInWithGoogle = async () => {
        return { success: false, error: "Google sign-in not implemented yet" };
    }

    const signOutUser = () => {
        authApi.logout();
        setUser(null);
    }

    // check if user is authenticated on app load
    useEffect(() => {
        const checkAuth = () => {
            const token = authApi.getToken();
            if(token){
                try{
                    const storedUser = localStorage.getItem('user');
                    if(storedUser){
                        setUser(JSON.parse(storedUser));
                    }
                    else{
                        // decode token if user object isn't stored but token is present
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        setUser({ id: payload.userId });
                    }
                }
                catch(error){
                    console.error("Error parsing stored user or token:", error.message);
                    authApi.logout(); // clear bad data
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const session = user ? { user } : null;

    // wrapping the context provider around children components
    return(
        <AuthContext.Provider value={{
            session, 
            user,
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