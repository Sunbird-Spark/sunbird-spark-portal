import { useEffect } from 'react';
import { useAppInfo } from './useAppInfo';

const SSO_PROVIDERS_STORAGE_KEY = 'sunbird-sso-providers';

/**
 * Writes the backend-driven enabled-SSO-providers list into localStorage so
 * the Keycloak login theme (same-origin, separate deploy) can read it to
 * decide which sign-in buttons to show.
 */
export const useSsoProvidersBridge = (): void => {
  const { data } = useAppInfo();
  const enabledSsoProviders = data?.data?.enabledSsoProviders;

  useEffect(() => {
    if (enabledSsoProviders) {
      localStorage.setItem(SSO_PROVIDERS_STORAGE_KEY, JSON.stringify(enabledSsoProviders));
    }
  }, [enabledSsoProviders]);
};
