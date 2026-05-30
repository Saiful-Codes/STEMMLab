import * as ImagePicker from 'expo-image-picker';
// expo-file-system v19 (SDK 54) moved the classic file API to the `/legacy`
// entry point. We use it here for the simple copy/delete operations this
// service needs (documentDirectory, copyAsync, makeDirectoryAsync, deleteAsync).
import * as FileSystem from 'expo-file-system/legacy';

const MEDIA_DIR = `${FileSystem.documentDirectory ?? ''}media/`;

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  quality: 0.7,
  mediaTypes: 'images',
  allowsEditing: false,
};

/**
 * Copy a picked/captured image out of the picker's cache directory into the
 * app's persistent document directory so it survives cache clears. Returns the
 * persistent URI, or null on failure.
 */
async function persistImage(cacheUri: string): Promise<string | null> {
  try {
    const dirInfo = await FileSystem.getInfoAsync(MEDIA_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
    }
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const dest = `${MEDIA_DIR}${name}`;
    await FileSystem.copyAsync({ from: cacheUri, to: dest });
    return dest;
  } catch (err) {
    console.warn('[mediaService] Failed to persist image:', err);
    return null;
  }
}

/**
 * Request camera permission and capture a photo. Returns the persistent URI,
 * or null if permission is denied, the user cancels, or anything fails.
 */
export async function capturePhoto(): Promise<{ uri: string } | null> {
  try {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return null;

    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const persistentUri = await persistImage(result.assets[0].uri);
    return persistentUri ? { uri: persistentUri } : null;
  } catch (err) {
    console.warn('[mediaService] capturePhoto failed:', err);
    return null;
  }
}

/**
 * Request media library permission and pick a photo from the gallery. Returns
 * the persistent URI, or null if permission is denied, the user cancels, or
 * anything fails.
 */
export async function pickPhoto(): Promise<{ uri: string } | null> {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return null;

    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const persistentUri = await persistImage(result.assets[0].uri);
    return persistentUri ? { uri: persistentUri } : null;
  } catch (err) {
    console.warn('[mediaService] pickPhoto failed:', err);
    return null;
  }
}

/**
 * Delete a photo file from the media directory. Idempotent — safe to call on a
 * URI that no longer exists. Failures are logged, never thrown.
 */
export async function deletePhoto(uri: string): Promise<void> {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (err) {
    console.warn('[mediaService] deletePhoto failed:', err);
  }
}
