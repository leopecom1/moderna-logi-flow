import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { LogOut, User, Crown, Users, Truck, DollarSign, Newspaper, MessageSquare } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { UpdatesPanel } from '@/components/updates/UpdatesPanel';
import { FeedbackPanel } from '@/components/feedback/FeedbackPanel';
import { useUSDRate } from '@/hooks/useCurrencyRates';
import { useSystemUpdates } from '@/hooks/useSystemUpdates';
import { useFeedback } from '@/hooks/useFeedback';

export const Header = () => {
  const [showUpdates, setShowUpdates] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const {
    profile,
    signOut
  } = useAuth();
  
  const { data: usdRate } = useUSDRate();
  const { unreadCount } = useSystemUpdates();
  const { pendingCount } = useFeedback();
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
  return <header className="h-14 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-[0_1px_3px_0_rgb(0_0_0/0.04)] animate-element animate-delay-100">
      <div className="h-full flex items-center justify-between px-5">
        <div className="flex items-center gap-4 animate-element animate-delay-200">
          <SidebarTrigger className="smooth-transition hover:bg-muted rounded-lg" />
          <div className="flex items-center gap-2.5">
            <Badge variant="outline" className={`${getRoleColor(profile.role)} smooth-transition border-0 shadow-sm px-2.5 py-1`}>
              {getRoleIcon(profile.role)}
              <span className="ml-1.5 capitalize text-[11px] font-semibold tracking-wide">{profile.role}</span>
            </Badge>

            {usdRate && (
              <Badge variant="secondary" className="flex items-center gap-1.5 smooth-transition shadow-sm border-0 px-2.5 py-1">
                <DollarSign className="h-3 w-3 opacity-60" />
                <span className="text-[11px] font-semibold tracking-wide">
                  USD: ${usdRate.sell_rate.toFixed(2)}
                </span>
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 animate-element animate-delay-300">
          <Button
            variant="ghost"
            size="sm"
            className="relative h-9 w-9 p-0 smooth-transition rounded-lg hover:bg-muted"
            onClick={() => setShowUpdates(true)}
            title="Novedades del sistema"
          >
            <Newspaper className="h-4 w-4 opacity-60" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="relative h-9 w-9 p-0 smooth-transition rounded-lg hover:bg-muted"
            onClick={() => setShowFeedback(true)}
            title="Feedback"
          >
            <MessageSquare className="h-4 w-4 opacity-60" />
            {profile?.role === 'gerencia' && pendingCount > 0 && (
              <Badge
                variant="secondary"
                className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm"
              >
                {pendingCount > 9 ? '9+' : pendingCount}
              </Badge>
            )}
          </Button>

          <NotificationDropdown />

          <div className="w-px h-6 bg-border/60 mx-1.5" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full smooth-transition p-0">
                <Avatar className="h-8 w-8 ring-2 ring-border/50 ring-offset-1 ring-offset-background">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                    {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 glass-card" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">{profile.full_name}</p>
                  <p className="text-xs leading-none text-muted-foreground capitalize">
                    {profile.role}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4 opacity-60" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4 opacity-60" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <UpdatesPanel open={showUpdates} onOpenChange={setShowUpdates} />
          <FeedbackPanel open={showFeedback} onOpenChange={setShowFeedback} />
        </div>
      </div>
    </header>;
};