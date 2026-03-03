import { Navigate, useLocation } from 'react-router-dom';
import { useDemoVersion } from '@/context/DemoVersionContext';

export const DemoRoute = ({ children }: { children: React.ReactNode }) => {
  const { demoVersion, isRouteAllowed } = useDemoVersion();
  const location = useLocation();

  if (demoVersion && !isRouteAllowed(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
