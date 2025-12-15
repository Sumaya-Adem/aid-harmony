import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, Plus, Bell, User, Shield, LogOut, Settings, Building2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onMenuClick: () => void;
  onSubmitAid: () => void;
}

export function Header({ onMenuClick, onSubmitAid }: HeaderProps) {
  const { user, profile, role, organizationName, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getRoleBadge = () => {
    if (isAdmin) {
      return <Badge variant="destructive" className="text-xs">Admin</Badge>;
    }
    if (role === 'ngo_user') {
      return <Badge variant="secondary" className="text-xs">NGO User</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Viewer</Badge>;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center gap-4">
        {/* Mobile Menu */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-semibold text-foreground leading-none">
              Badbaado Aid Track
            </h1>
            <p className="text-xs text-muted-foreground">Humanitarian Coordination</p>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Organization Badge */}
        {organizationName && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{organizationName}</span>
          </div>
        )}

        {/* Submit Aid Button */}
        {user && (
          <>
            <Button onClick={onSubmitAid} size="sm" className="hidden sm:flex">
              <Plus className="h-4 w-4 mr-1" />
              Submit Aid
            </Button>
            <Button onClick={onSubmitAid} size="icon" className="sm:hidden">
              <Plus className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Notifications */}
        {user && (
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
          </Button>
        )}

        {/* User Menu */}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.full_name || 'User'}</p>
                  <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  <div className="pt-1">{getRoleBadge()}</div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate('/admin')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Admin Settings
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>My Reports</DropdownMenuItem>
              <DropdownMenuItem>Help & Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button onClick={() => navigate('/auth')} size="sm">
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
}
