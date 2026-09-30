import { useSsoProvidersBridge } from '@/hooks/useSsoProvidersBridge';

/** Renders nothing — runs the SSO-providers localStorage bridge inside the QueryClient tree. */
export const SsoProvidersBridge = () => {
  useSsoProvidersBridge();
  return null;
};
