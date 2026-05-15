import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { View, StyleSheet } from 'react-native';
import {
  ADS_ENABLED,
  BANNER_AD_UNIT_ID,
  AD_REQUEST_OPTIONS,
} from '../config/ads';

export default function AdBanner() {
  if (!ADS_ENABLED) return null;
  return (
    <View style={styles.wrap}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={AD_REQUEST_OPTIONS}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 4 },
});
