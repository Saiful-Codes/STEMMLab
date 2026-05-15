import { Platform } from 'react-native';
import { MaxAdContentRating, TestIds } from 'react-native-google-mobile-ads';

// Flip to false to disable ads at runtime.
// Banner returns null; initAds and showInterstitialIfReady early-return.
export const ADS_ENABLED = true;

// When true, ALWAYS use Google's public test ad unit IDs.
// When false, dev builds (__DEV__) still use test IDs; release builds use the prod IDs below.
export const USE_TEST_ADS = __DEV__;

// Real STEMMLab ad unit IDs from the AdMob console.
// These ONLY get used in release builds (USE_TEST_ADS = false).
// Dev builds always serve Google test creatives — see USE_TEST_ADS above.
// iOS placeholders are intentional: no iOS AdMob app exists; iOS release builds
// would need real iOS ad unit IDs filled in here first.
const PROD_BANNER_ID = Platform.select({
  android: 'ca-app-pub-3303747010451108/4308671431',
  ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
}) as string;

const PROD_INTERSTITIAL_ID = Platform.select({
  android: 'ca-app-pub-3303747010451108/4500243121',
  ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
}) as string;

export const BANNER_AD_UNIT_ID = USE_TEST_ADS ? TestIds.BANNER : PROD_BANNER_ID;
export const INTERSTITIAL_AD_UNIT_ID = USE_TEST_ADS
  ? TestIds.INTERSTITIAL
  : PROD_INTERSTITIAL_ID;

// COPPA / GDPR-K / kid-safe content rating
export const AD_REQUEST_CONFIG = {
  maxAdContentRating: MaxAdContentRating.G,
  tagForChildDirectedTreatment: true,
  tagForUnderAgeOfConsent: true,
};

export const AD_REQUEST_OPTIONS = {
  requestNonPersonalizedAdsOnly: true,
};
