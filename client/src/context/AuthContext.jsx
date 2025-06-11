import { createContext, useEffect, useState, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => { 
    const [session, setSession] = useState("undefined");


    const signUpUser = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
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

    useEffect(() => {
        const session = supabase.auth.getSession();
        setSession(session);
        
        supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

    }, []);

    const signOutUser = () => {
        const { error } = supabase.auth.signOut();
        if(error) {
            console.error("Error signing out:", error);
        }
    }


    return(
        <AuthContext.Provider value={{session, signInUser, signUpUser, signOutUser}}>
            {children}
        </AuthContext.Provider>
    )
}

export const UserAuth = () => {
    return useContext(AuthContext);
};