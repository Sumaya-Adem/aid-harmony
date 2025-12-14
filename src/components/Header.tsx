import { Button } from '@/components/ui/button';
import { Menu, Plus, Bell, User, Shield } from 'lucide-react';
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

        {/* Submit Aid Button */}
        <Button onClick={onSubmitAid} size="sm" className="hidden sm:flex">
          <Plus className="h-4 w-4 mr-1" />
          Submit Aid
        </Button>
        <Button onClick={onSubmitAid} size="icon" className="sm:hidden">
          <Plus className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>UNICEF Somalia</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Organization Settings</DropdownMenuItem>
            <DropdownMenuItem>My Reports</DropdownMenuItem>
            <DropdownMenuItem>Help & Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
