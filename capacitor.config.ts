import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.beloved.rides',
  appName: 'BeLoved Rides',
  webDir: 'mobile-app',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FFFFFF",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP"
    },
    Keyboard: {
      resize: 'ionic',
      style: 'default',
      hideFormAccessoryBar: false,
      resizeOnFullScreen: true
    }
  },
  server: {
    url: "https://be-loved-scheduler.vercel.app",
    cleartext: true,
    androidScheme: 'https'
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    preferredContentMode: 'mobile',
    allowsLinkPreview: false,
    scheme: 'BeLovedRides',
    limitsNavigationsToAppBoundDomains: true
  }
};

export default config;
