import { Button } from "@/components/ui/button";
import { ChevronRightIcon, Code2, Folder, Users, Search, Star, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Particles } from "./Particles";
import { useTheme } from "./theme-provider";

export default function Hero() {
  const { theme } = useTheme();
  
  const particleColors = theme === "dark" 
    ? ["#ffffff", "#e5e7eb", "#d1d5db"] 
    : ["#000000", "#1a1814", "#2e2a24"]; 

  return (
    <>
      {/* Hero */}
      <div className="min-h-screen flex items-center -mt-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Particles 
            particleCount={100}
            particleSpread={5}
            speed={0.07}
            particleColors={particleColors}
            alphaParticles={true}
            particleBaseSize={50}
            sizeRandomness={0.5}
            cameraDistance={15}
            disableRotation={false}
            className="w-full h-full"
          />
        </div>
        <div className="container mx-auto px-4 md:px-6 2xl:max-w-[1400px] relative z-10">
          {/* Announcement Banner */}
          <div className="flex justify-center">
            <div
              className="inline-flex items-center gap-x-2 rounded-full border p-1 ps-3 text-sm transition hover:bg-accent"
              href="#"
            >
              ✨ Now with Monaco Editor integration
              <span className="bg-muted-foreground/15 inline-flex items-center justify-center gap-x-2 rounded-full px-2.5 py-1.5 text-sm font-semibold">
                :)
              </span>
            </div>
          </div>
          {/* End Announcement Banner */}
          
          {/* Title */}
          <div className="mx-auto mt-5 max-w-4xl text-center">
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-6xl">
              Organize Your Code Snippets Like a{" "}
              <span className="text-primary">Pro</span>
            </h1>
          </div>
          {/* End Title */}
          
          <div className="mx-auto mt-5 max-w-3xl text-center">
            <p className="text-muted-foreground text-xl">
              SnipSort is the ultimate code snippet manager for developers. Store, organize, and share your code snippets with powerful search, syntax highlighting, and team collaboration features.
            </p>
          </div>
          
          {/* Buttons */}
          <div className="mt-8 flex justify-center gap-3">
            <Button size={"lg"} asChild className="group">
              <Link to="/signup" className="flex items-center gap-2">
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
          {/* End Buttons */}
          
          {/* <div className="mt-5 flex items-center justify-center gap-x-1 sm:gap-x-3">
            <span className="text-muted-foreground text-sm">
              Trusted by developers at:
            </span>
            <span className="text-sm font-bold">Google</span>
            <svg
              className="text-muted-foreground h-5 w-5"
              width={16}
              height={16}
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M6 13L10 3"
                stroke="currentColor"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-sm font-bold">Microsoft</span>
            <svg
              className="text-muted-foreground h-5 w-5"
              width={16}
              height={16}
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M6 13L10 3"
                stroke="currentColor"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-sm font-bold">Meta</span>
          </div> */}
        </div>
      </div>
      {/* End Hero */}

      {/* Features Section */}
      <div className="bg-muted/30">
        <div className="container mx-auto px-4 py-24 md:px-6 2xl:max-w-[1400px]">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight lg:text-4xl mb-4">
              Everything you need to manage code snippets
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From personal organization to team collaboration, SnipSort has all the features you need.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Syntax Highlighting</h3>
              <p className="text-muted-foreground">
                Beautiful syntax highlighting for 25+ programming languages with Monaco Editor integration.
              </p>
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Folder className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Organization</h3>
              <p className="text-muted-foreground">
                Organize snippets with folders, tags, and projects. Never lose track of your code again.
              </p>
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
              <p className="text-muted-foreground">
                Share snippets with your team through collaborative projects and workspaces.
              </p>
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Powerful Search</h3>
              <p className="text-muted-foreground">
                Find any snippet instantly with full-text search across code, titles, and tags.
              </p>
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Favorites & Bookmarks</h3>
              <p className="text-muted-foreground">
                Mark your most-used snippets as favorites for quick access when you need them.
              </p>
            </div>

            <div className="bg-background rounded-lg p-6 shadow-sm border">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Version Control</h3>
              <p className="text-muted-foreground">
                Track changes to your snippets with automatic versioning and edit history.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}