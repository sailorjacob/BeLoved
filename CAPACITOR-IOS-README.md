# Be-Loved Rides iOS App Setup with Capacitor

This document outlines the steps that have been taken to prepare your Next.js application for iOS deployment using Capacitor, and what steps remain to complete the setup.

## What's Been Done

1. **Capacitor Installation**: The core Capacitor packages have been installed.
2. **Project Configuration**: A `capacitor.config.ts` file has been created with iOS-specific settings.
3. **Mobile Landing Page**: A simple mobile landing page has been created in the `mobile-app` directory that loads your web application.
4. **iOS Project Generation**: An iOS Xcode project has been generated in the `ios` directory.
5. **Native Plugins**: The following Capacitor plugins have been installed:
   - Push Notifications (`@capacitor/push-notifications`)
   - Geolocation (`@capacitor/geolocation`)
   - Device Information (`@capacitor/device`)

## What Needs to Be Done

To complete the iOS app setup and publish it to TestFlight or the App Store, you'll need to:

1. **Install Xcode**: Make sure Xcode is installed on your Mac (from the Mac App Store).
2. **Install CocoaPods**: Run `sudo gem install cocoapods` to install CocoaPods.
3. **Select Proper Xcode Command Line Tools**: Run `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`.
4. **Sync Capacitor**: Run `npx cap sync ios` to sync the web content and plugins.
5. **Open Xcode Project**: Run `npx cap open ios` to open the Xcode project.
6. **Configure App Settings in Xcode**:
   - Set up your Apple Developer account in Xcode
   - Configure app icons and launch screens
   - Set proper bundle ID and version
   - Configure push notification entitlements (if using push notifications)

7. **Test on Simulator and Devices**:
   - Test in iOS Simulator
   - Register for an Apple Developer account if you haven't already ($99/year)
   - Test on physical devices

8. **Native Feature Integration**:
   Once Xcode is properly configured, you can integrate native features using the installed plugins:

   ```javascript
   // Push Notifications
   import { PushNotifications } from '@capacitor/push-notifications';

   // Request permission to use push notifications
   // iOS will prompt user and return if they granted permission or not
   // Android will just grant without prompting
   PushNotifications.requestPermissions().then(result => {
     if (result.receive === 'granted') {
       // Register with Apple / Google to receive push notifications
       PushNotifications.register();
     }
   });

   // Geolocation
   import { Geolocation } from '@capacitor/geolocation';

   const getCurrentPosition = async () => {
     const coordinates = await Geolocation.getCurrentPosition();
     console.log('Current position:', coordinates);
     return coordinates;
   };

   // Device Info
   import { Device } from '@capacitor/device';

   const getDeviceInfo = async () => {
     const info = await Device.getInfo();
     console.log('Device info:', info);
     return info;
   };
   ```

9. **Prepare for App Store Submission**:
   - Create app icons and splash screens
   - Write app description and privacy policy
   - Take screenshots for App Store listing
   - Complete App Store Connect setup

## Development Workflow

After completing the setup, your development workflow will be:

1. Make changes to your web application
2. Run `npm run build` to build the web app
3. Run `npx cap sync ios` to update the iOS app with changes
4. Test in Xcode simulator or on device
5. When ready, submit to TestFlight or App Store using Xcode

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS App Development](https://developer.apple.com/ios/)
- [Apple Developer Program](https://developer.apple.com/programs/)
- [TestFlight Documentation](https://developer.apple.com/testflight/)

## Troubleshooting

If you encounter issues with Xcode or need help with iOS app signing and deployment, refer to:
- [Xcode Help](https://help.apple.com/xcode/mac/current/)
- [Capacitor iOS Troubleshooting](https://capacitorjs.com/docs/ios/troubleshooting) 