import { useEffect, useState } from 'react';

export type Platform = 'web' | 'ios' | 'unknown';

export function usePlatform() {
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Only run on client-side
    if (typeof window !== 'undefined') {
      // Check if running in Capacitor
      if (window.Capacitor?.isNative === true || (window as any).Capacitor?.isNative === true) {
        setPlatform('ios');
      } else {
        setPlatform('web');
      }
      setIsLoaded(true);
    }
  }, []);
  
  return { 
    platform, 
    isLoaded,
    isWeb: platform === 'web',
    isIos: platform === 'ios',
    isNative: platform === 'ios', // Alias for convenience
  };
} 