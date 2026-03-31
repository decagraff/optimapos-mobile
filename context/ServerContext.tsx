import { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { storage } from '@/services/storage';
import { api } from '@/services/api';
import type { ServerConfig } from '@/types';

interface ServerContextType {
  config: ServerConfig | null;
  isLoading: boolean;
  isConfigured: boolean;
  configure: (slug: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

export const ServerContext = createContext<ServerContextType>({
  config: null,
  isLoading: true,
  isConfigured: false,
  configure: async () => {},
  disconnect: async () => {},
});

function buildConfig(slug: string): ServerConfig {
  const tenantHost = `${slug}.decatron.net`;
  return {
    slug,
    baseUrl: `https://${tenantHost}`,
    tenantHost,
  };
}

export function ServerProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const slug = await storage.getSlug();
        if (slug) {
          const cfg = buildConfig(slug);
          api.configure(cfg.baseUrl, cfg.tenantHost);
          setConfig(cfg);
        }
      } catch (err) { console.warn("[Server] Load config failed:", err); }
      setIsLoading(false);
    })();
  }, []);

  const configure = useCallback(async (slug: string) => {
    const cfg = buildConfig(slug.toLowerCase().trim());
    api.configure(cfg.baseUrl, cfg.tenantHost);
    await storage.setSlug(cfg.slug);
    setConfig(cfg);
  }, []);

  const disconnect = useCallback(async () => {
    await storage.clearAll();
    api.configure('', '');
    api.setToken(null);
    setConfig(null);
  }, []);

  return (
    <ServerContext.Provider value={{ config, isLoading, isConfigured: !!config, configure, disconnect }}>
      {children}
    </ServerContext.Provider>
  );
}
