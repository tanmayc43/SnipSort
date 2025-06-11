import { Button } from "../components/ui/button";
import { UserAuth } from "../context/AuthContext"
import { useNavigate } from "react-router-dom";


export default function Dashboard(){
    const {session, signOutUser} = UserAuth();
    const navigate = useNavigate();
    console.log(session);

    const handleSignOut = async (e) => {
        e.preventDefault();
        try {
            await signOutUser();
            navigate('/login');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    }

    if (!session) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <h1 className="text-2xl font-bold">You are not logged in</h1>
            </div>
        );
    }

    return(
        <div className="flex h-screen w-full items-center justify-center">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <h2>welcome {session?.user?.email}</h2>
            <Button onClick = {handleSignOut}
                className="mt-4">
                Sign Out    
            </Button>
        </div>
    )
}