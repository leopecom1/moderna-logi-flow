import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type DemoVersion = 'v1' | 'v2' | 'v3' | null;

interface DemoVersionContextType {
  demoVersion: DemoVersion;
  setDemoVersion: (version: DemoVersion) => void;
  isRouteAllowed: (path: string) => boolean;
  getAllowedCategories: () => string[] | null;
}

const STORAGE_KEY = 'moderna-demo-version';

const V1_CATEGORIES = ['Dashboard', 'Comercial'];
const V2_CATEGORIES = ['Dashboard', 'Comercial', 'Inventario', 'Operaciones'];
// V3 = todo

const V1_ROUTES = [
  '/', '/auth', '/profile', '/incidents', '/unauthorized',
  '/customers', '/orders', '/deliveries', '/collections', '/accounts-receivable',
];

const V2_ROUTES = [
  ...V1_ROUTES,
  '/products', '/inventory', '/stock-movements',
  '/logistics', '/routes-management', '/routes', '/routes-view',
  '/route-optimization', '/assembly', '/armadores', '/cadetes', '/vehiculos',
];

// Rutas con parametros dinamicos
const V1_ROUTE_PATTERNS = ['/customers/', '/orders/'];
const V2_ROUTE_PATTERNS = [...V1_ROUTE_PATTERNS, '/routes/', '/cadetes/'];

const DemoVersionContext = createContext<DemoVersionContextType | null>(null);

export const DemoVersionProvider = ({ children }: { children: ReactNode }) => {
  const [demoVersion, setDemoVersionState] = useState<DemoVersion>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'v1' || stored === 'v2' || stored === 'v3') return stored;
    return null;
  });

  const setDemoVersion = (version: DemoVersion) => {
    setDemoVersionState(version);
    if (version) {
      localStorage.setItem(STORAGE_KEY, version);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const isRouteAllowed = (path: string): boolean => {
    if (!demoVersion || demoVersion === 'v3') return true;

    const routes = demoVersion === 'v1' ? V1_ROUTES : V2_ROUTES;
    const patterns = demoVersion === 'v1' ? V1_ROUTE_PATTERNS : V2_ROUTE_PATTERNS;

    if (routes.includes(path)) return true;
    if (patterns.some(p => path.startsWith(p))) return true;

    return false;
  };

  const getAllowedCategories = (): string[] | null => {
    if (!demoVersion || demoVersion === 'v3') return null; // null = todo permitido
    if (demoVersion === 'v1') return V1_CATEGORIES;
    if (demoVersion === 'v2') return V2_CATEGORIES;
    return null;
  };

  return (
    <DemoVersionContext.Provider value={{ demoVersion, setDemoVersion, isRouteAllowed, getAllowedCategories }}>
      {children}
    </DemoVersionContext.Provider>
  );
};

export const useDemoVersion = () => {
  const ctx = useContext(DemoVersionContext);
  if (!ctx) throw new Error('useDemoVersion must be used within DemoVersionProvider');
  return ctx;
};
