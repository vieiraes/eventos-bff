import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface OrganizerLayoutProps {
  children: ReactNode
}

export function OrganizerLayout({ children }: OrganizerLayoutProps) {
  const { user, signOut } = useAuth()
  const location = useLocation()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/organizer', icon: '📊' },
    { name: 'Meus Eventos', href: '/organizer/events', icon: '🎫' },
  ]

  const isActive = (href: string) => {
    if (href === '/organizer') {
      return location.pathname === href
    }
    return location.pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation */}
      <nav className="bg-purple-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/organizer" className="text-white text-xl font-bold">
                🎯 Eventos BFF - Organizer
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-purple-200 hover:text-white text-sm"
              >
                ← Voltar ao site
              </Link>
              <span className="text-purple-200 text-sm">
                {user?.full_name}
              </span>
              <button
                onClick={handleSignOut}
                className="text-purple-200 hover:text-white text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Side Navigation */}
      <div className="flex">
        <aside className="w-64 flex-shrink-0 bg-white shadow-md min-h-[calc(100vh-4rem)]">
          <nav className="mt-5 px-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center px-4 py-3 text-sm font-medium rounded-md mb-1
                  ${
                    isActive(item.href)
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <span className="mr-3 text-xl">{item.icon}</span>
                <span className="whitespace-nowrap">{item.name}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
