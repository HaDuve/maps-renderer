import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform, Alert, Linking } from 'react-native';

export class VideoExportService {
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async saveVideoToGallery(videoUri: string, albumName: string = 'Travel Routes'): Promise<MediaLibrary.Asset> {
    try {
      // Check permissions
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        throw new Error('Media library permissions not granted');
      }

      // Download if remote URL
      let localUri = videoUri;
      if (videoUri.startsWith('http')) {
        const filename = `video_${Date.now()}.mp4`;
        const downloadResult = await FileSystem.downloadAsync(
          videoUri,
          FileSystem.documentDirectory + filename
        );
        localUri = downloadResult.uri;
      }

      // Create asset in media library
      const asset = await MediaLibrary.createAssetAsync(localUri);

      // Create or get album
      let album = await MediaLibrary.getAlbumAsync(albumName);
      if (album == null) {
        await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      return asset;
    } catch (error) {
      console.error('Error saving video:', error);
      throw error;
    }
  }

  async shareVideo(videoUri: string): Promise<void> {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Sharing not available on this device');
      }

      await Sharing.shareAsync(videoUri, {
        mimeType: 'video/mp4',
        dialogTitle: 'Share Route Video',
        UTI: 'public.movie'
      });
    } catch (error) {
      console.error('Sharing failed:', error);
      throw error;
    }
  }

  async getStorageInfo() {
    try {
      const totalSpace = await FileSystem.getTotalDiskCapacityAsync();
      const freeSpace = await FileSystem.getFreeDiskStorageAsync();

      return {
        totalSpace: Math.round(totalSpace / (1024 * 1024 * 1024)), // GB
        freeSpace: Math.round(freeSpace / (1024 * 1024 * 1024)), // GB
        usedPercentage: Math.round(((totalSpace - freeSpace) / totalSpace) * 100)
      };
    } catch (error) {
      console.error('Storage info failed:', error);
      return null;
    }
  }

  handleError(error: Error, operation: string = 'video export') {
    let userMessage = `Failed to ${operation}. `;
    let actionRequired = false;

    if (error.message.includes('permission')) {
      userMessage += 'Please grant media library permissions in settings.';
      actionRequired = true;
    } else if (error.message.includes('storage')) {
      userMessage += 'Not enough storage space available.';
    } else if (error.message.includes('network')) {
      userMessage += 'Please check your internet connection.';
    } else {
      userMessage += 'Please try again.';
    }

    const buttons = [{ text: 'OK', style: 'default' as const }];

    if (actionRequired) {
      buttons.unshift({
        text: 'Open Settings',
        onPress: () => Linking.openSettings()
      } as const);
    }

    Alert.alert('Error', userMessage, buttons);
  }
}
