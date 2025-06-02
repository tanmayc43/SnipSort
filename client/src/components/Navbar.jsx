import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
//import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'
import { motion, useScroll } from 'framer-motion'
import { Link } from 'react-router-dom'
import { routes } from '@/routes'

export function Navbar() {
  const [menuState, setMenuState] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollYProgress } = useScroll()

  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      setScrolled(latest > 0.05)
    })
    return () => unsubscribe()
  }, [scrollYProgress])

  // Filter routes to use only those you want in navbar
  const navbarRoutes = routes.filter(route =>
    ['Features', 'Solution', 'Pricing', 'About'].includes(route.name)
  )

  return (
    <header>
      <nav data-state={menuState && 'active'} className="fixed z-20 w-full pt-2">
        <div className={cn(
          'mx-auto max-w-7xl rounded-3xl px-6 transition-all duration-300 lg:px-12',
          scrolled && 'bg-background/50 backdrop-blur-2xl'
        )}>
          <motion.div
            key={1}
            className={cn(
              'relative flex flex-wrap items-center justify-between gap-6 py-3 duration-200 lg:gap-0 lg:py-6',
              scrolled && 'lg:py-4'
            )}
          >
            <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
              <Link to="/" aria-label="home" className="flex items-center space-x-2">
                <Logo />
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? 'Close Menu' : 'Open Menu'}
                className="relative z-20 -m-2.5 -mr-4 block p-2.5 lg:hidden"
              >
                <Menu className={cn(
                  'm-auto size-6 duration-200',
                  menuState && 'rotate-180 scale-0 opacity-0'
                )} />
                <X className={cn(
                  'absolute inset-0 m-auto size-6 rotate-[-180deg] scale-0 opacity-0 duration-200',
                  menuState && 'rotate-0 scale-100 opacity-100'
                )} />
              </button>

              <div className="hidden lg:block">
                <ul className="flex gap-8 text-sm">
                  {navbarRoutes.map(({ path, name }) => (
                    <li key={path}>
                      <Link
                        to={path}
                        className="block text-muted-foreground duration-150 hover:text-accent-foreground"
                        onClick={() => setMenuState(false)}
                      >
                        {name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className={cn(
              'hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none',
              'bg-background dark:shadow-none',
              menuState && 'block'
            )}>
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {navbarRoutes.map(({ path, name }) => (
                    <li key={path}>
                      <Link
                        to={path}
                        className="block text-muted-foreground duration-150 hover:text-accent-foreground"
                        onClick={() => setMenuState(false)}
                      >
                        {name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </nav>
    </header>
  )
}
