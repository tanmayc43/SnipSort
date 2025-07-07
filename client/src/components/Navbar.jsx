import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ToggleButton } from "@/components/ToggleButton"
import { Link } from "react-router-dom";
import { Code2 } from "lucide-react";

export default function Component() {
  return (
    <header className="h-20 w-full shrink-0 relative z-50 bg-transparent">
      <div className="max-w-screen-xl mx-auto w-full flex items-center h-full px-4 md:px-8">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden">
              <Code2 className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <div className="flex items-center mb-4">
              <MountainIcon className="h-6 w-6 mr-2" />
              <span className="sr-only">SnipSort</span>
            </div>
            <div className="grid gap-2 py-6">
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link to="/">Home</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link to="/about">About</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link to="/">Features</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start">
                <Link to="/contact">Contact</Link>
              </Button>
              <div className="flex gap-2 mt-4">
                <ToggleButton />
                <Button asChild variant="default" className="flex-1">
                  <Link to="/signup">Sign Up</Link>
                </Button>
                <Button asChild variant="default" className="flex-1">
                  <Link to="/login">Login</Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        {/* Desktop logo */}
        <a href="#" className="mr-6 hidden lg:flex">
          <Code2 className="h-6 w-6" />
          <span className="sr-only">SnipSort</span>
        </a>
        {/* Desktop nav */}
        <nav className="hidden lg:flex gap-2">
          <Button asChild variant="ghost">
            <Link to="/">Home</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/about">About</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/">Features</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/contact">Contact</Link>
          </Button>
        </nav>
        {/* Right side buttons */}
        <div className="ml-auto hidden lg:flex items-center gap-2">
          <ToggleButton />
          <Button asChild variant="outline">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild variant="default">
            <Link to="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

function MenuIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}

function MountainIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  )
}