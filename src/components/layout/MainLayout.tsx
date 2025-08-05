import { useAuth } from '@/hooks/useAuth';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';
import { Toaster } from '@/components/ui/toaster';
import { useNotificationToast } from '@/hooks/useNotificationToast';
import { MessageLoading } from '@/components/ui/message-loading';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { profile } = useAuth();
  useNotificationToast(); // Hook para mostrar toast de notificaciones

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MessageLoading />
      </div>
    );
  }

  return (
    <div className="font-sans">
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 flex flex-col">
            <Header />
            <div className="flex-1 p-6 bg-muted/30">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
      <Toaster />
    </div>
  );
};