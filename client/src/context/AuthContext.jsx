import { createContext, useEffect, useState, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => { 
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    const signUpUser = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/dashboard`
            }
        });
        if (error) {
            console.error("Error signing up:", error);
            return {success: false, error: error.message};
        }
        return {success: true, data};
    }

    const signInUser = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) {
            console.error("Error signing in:", error);
            return {success: false, error: error.message};
        }
        return {success: true, data};
    }

    const signInWithGoogle = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard`
            }
        });
        if (error) {
            console.error("Error signing in with Google:", error);
            return {success: false, error: error.message};
        }
        return {success: true, data};
    }

    const signOutUser = async () => {
        const { error } = await supabase.auth.signOut();
        if(error) {
            console.error("Error signing out:", error);
            throw error;
        }
    }

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

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