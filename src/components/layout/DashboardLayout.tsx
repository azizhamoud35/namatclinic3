import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-24 items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/namatclinic.png" alt="Namat Logo" className="h-12 w-22" />
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#7dda55] to-[#7dda55]/70 bg-clip-text text-transparent">
                
              </h1>
            </div>
            
            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Desktop navigation */}
            <div className="hidden md:flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {currentUser?.email}
              </span>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>

          {/* Mobile navigation */}
          <div
            className={cn(
              "md:hidden",
              mobileMenuOpen ? "block" : "hidden"
            )}
          >
            <div className="space-y-4 py-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm text-muted-foreground px-2">
                  {currentUser?.email}
                </span>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}