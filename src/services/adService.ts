import mobileAds, {
  AdEventType,
  InterstitialAd,
} from 'react-native-google-mobile-ads';
import {
  ADS_ENABLED,
  INTERSTITIAL_AD_UNIT_ID,
  AD_REQUEST_CONFIG,
  AD_REQUEST_OPTIONS,
} from '../config/ads';

let interstitial: InterstitialAd | null = null;
let isLoaded = false;
let initialized = false;

// One-shot SDK initialisation. Call from App.tsx on mount.
// Quietly no-ops if ads are disabled or init has already run.
export async function initAds(): Promise<void> {
  if (!ADS_ENABLED || initialized) return;
  try {
    await mobileAds().setRequestConfiguration(AD_REQUEST_CONFIG);
    await mobileAds().initialize();
    initialized = true;
    loadInterstitial();
  } catch (err) {
    console.warn('[adService] init failed:', err);
  }
}

function loadInterstitial(): void {
  if (!ADS_ENABLED) return;
  try {
    interstitial = InterstitialAd.createForAdRequest(
      INTERSTITIAL_AD_UNIT_ID,
      AD_REQUEST_OPTIONS,
    );
    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      isLoaded = true;
    });
    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      isLoaded = false;
      loadInterstitial();
    });
    interstitial.addAdEventListener(AdEventType.ERROR, (err) => {
      console.warn('[adService] interstitial error:', err);
      isLoaded = false;
    });
    interstitial.load();
  } catch (err) {
    console.warn('[adService] loadInterstitial failed:', err);
  }
}

// Non-blocking. Returns immediately if the ad isn't loaded (or ads disabled).
// Safe to call fire-and-forget right before navigation.
export function showInterstitialIfReady(): void {
  if (!ADS_ENABLED || !interstitial || !isLoaded) return;
  try {
    interstitial.show();
  } catch (err) {
    console.warn('[adService] show failed:', err);
  }
}
