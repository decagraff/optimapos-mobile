import { useContext } from 'react';
import { ServerContext } from '@/context/ServerContext';

export function useServer() {
  return useContext(ServerContext);
}
