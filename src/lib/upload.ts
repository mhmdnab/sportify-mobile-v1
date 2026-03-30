import * as ImagePicker from 'expo-image-picker';
import { getAccessToken } from './secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * Opens the device image picker and uploads the selected image
 * to the backend, which stores it in Cloudflare R2.
 *
 * Returns the public URL of the uploaded image, or null if cancelled.
 */
export async function pickAndUploadImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  return uploadImageAsset(result.assets[0]);
}

/**
 * Opens the camera and uploads the captured image.
 * Returns the public URL, or null if cancelled.
 */
export async function captureAndUploadImage(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 0.85,
  });

  if (result.canceled || !result.assets?.[0]) return null;

  return uploadImageAsset(result.assets[0]);
}

async function uploadImageAsset(asset: ImagePicker.ImagePickerAsset): Promise<string | null> {
  const uri = asset.uri;
  const filename = uri.split('/').pop() ?? 'image.jpg';
  const mimeType = asset.mimeType ?? 'image/jpeg';

  const formData = new FormData();
  formData.append('file', { uri, name: filename, type: mimeType } as any);

  const token = await getAccessToken();

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!response.ok) return null;

  const { url } = await response.json();
  return url ?? null;
}
