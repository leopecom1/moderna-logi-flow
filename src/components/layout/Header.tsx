import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LogOut, User, Crown, Users, Truck, DollarSign } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { useUSDRate } from '@/hooks/useCurrencyRates';
export const Header = () => {
  const {
    profile,
    signOut
  } = useAuth();
  
  const { data: usdRate } = useUSDRate();
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'gerencia':
        return <Crown className="h-3 w-3" />;
      case 'vendedor':
        return <Users className="h-3 w-3" />;
      case 'cadete':
        return <Truck className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'gerencia':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'vendedor':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cadete':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };
  if (!profile) return null;
  return <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-element animate-delay-100">
      <div className="h-full flex items-center justify-between px-4">
        <div className="flex items-center gap-4 animate-element animate-delay-200">
          <SidebarTrigger className="smooth-transition" />
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${getRoleColor(profile.role)} smooth-transition`}>
              {getRoleIcon(profile.role)}
              <span className="ml-1 capitalize">{profile.role}</span>
            </Badge>
            
            {usdRate && (
              <Badge variant="secondary" className="flex items-center gap-1 smooth-transition">
                <DollarSign className="h-3 w-3" />
                <span className="text-xs">
                  USD: ${usdRate.sell_rate.toFixed(2)}
                </span>
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 animate-element animate-delay-300">
          <NotificationDropdown />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full smooth-transition">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 glass-card" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>;
};