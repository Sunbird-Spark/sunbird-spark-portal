import { config as baseConfig } from "./wdio.conf.js";

export const config: WebdriverIO.Config = {
  ...baseConfig,

  // Allow Appium to auto-download matching Chromedriver for emulator Chrome.
  services: [
    [
      'appium',
      {
        args: {
          allowInsecure: 'chromedriver_autodownload',
        },
      },
    ],
    'visual',
  ],

  // Override capabilities for Android
  capabilities: [
    {
      // capabilities for local Appium native app tests on Android Emulator
      platformName: "Android",

      browserName: "chrome", 

      "appium:deviceName": "Pixel_7_API_35",
      "appium:platformVersion": "14",
      "appium:automationName": "UiAutomator2",
      "appium:udid": "emulator-5554",
      "appium:chromedriverAutodownload": true,
      // "appium:app": "C:\\Users\\Accel\\OneDrive\\Desktop\\sunbird-coss\\app\\app\\android\\Sunbird.apk",
      // "appium:appPackage": "com.scriptlab",
      // "appium:appActivity": ".MainActivity",
      "appium:newCommandTimeout": 600,
      "appium:noReset": false,
    },
  ],
};