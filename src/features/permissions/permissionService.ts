import { Linking } from 'react-native';
import * as MediaLibrary from 'expo-media-library';

export async function getPhotoPermissions() {
  return MediaLibrary.getPermissionsAsync();
}

export async function requestPhotoPermissions() {
  return MediaLibrary.requestPermissionsAsync();
}

export async function presentPhotoPermissionsPicker() {
  return MediaLibrary.presentPermissionsPickerAsync(['photo']);
}

export async function openSettings() {
  await Linking.openSettings();
}
