import { captureRef } from "react-native-view-shot";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Alert, Linking } from "react-native";

export interface RecordingOptions {
  fps: number;
  duration: number; // in seconds
  quality: number; // 0.0 to 1.0
  format: "png" | "jpg";
}

export interface FrameData {
  uri: string;
  timestamp: number;
  index: number;
}

export class VideoRecordingService {
  private frames: FrameData[] = [];
  private isRecording = false;
  private recordingOptions: RecordingOptions;

  handleError(error: Error, operation: string = 'video recording') {
    let userMessage = `Failed to ${operation}. `;
    let actionRequired = false;

    if (error.message.includes('permission')) {
      userMessage += 'Please grant camera and storage permissions in settings.';
      actionRequired = true;
    } else if (error.message.includes('storage')) {
      userMessage += 'Not enough storage space available.';
    } else if (error.message.includes('Recording already')) {
      userMessage += 'Please stop the current recording first.';
    } else {
      userMessage += 'Please try again.';
    }

    const buttons: Array<{text: string, style?: 'default' | 'cancel' | 'destructive', onPress?: () => void}> = [{ text: 'OK', style: 'default' }];

    if (actionRequired) {
      buttons.unshift({
        text: 'Open Settings',
        onPress: () => Linking.openSettings()
      });
    }

    Alert.alert('Error', userMessage, buttons);
  }

  constructor(options: Partial<RecordingOptions> = {}) {
    this.recordingOptions = {
      fps: 30,
      duration: 10,
      quality: 0.8,
      format: "png",
      ...options,
    };
  }

  async startRecording(): Promise<void> {
    if (this.isRecording) {
      throw new Error("Recording already in progress");
    }

    this.isRecording = true;
    this.frames = [];
  }

  async captureFrame(viewRef: any, frameIndex: number): Promise<void> {
    if (!this.isRecording) return;

    try {
      const uri = await captureRef(viewRef, {
        format: this.recordingOptions.format,
        quality: this.recordingOptions.quality,
        result: "tmpfile",
      });

      const frameData: FrameData = {
        uri,
        timestamp: Date.now(),
        index: frameIndex,
      };

      this.frames.push(frameData);
    } catch (error) {
      console.error("Frame capture failed:", error);
      throw error;
    }
  }

  async stopRecording(): Promise<FrameData[]> {
    this.isRecording = false;
    return [...this.frames];
  }

  async createVideoFromFrames(frames: FrameData[]): Promise<string> {
    if (frames.length === 0) {
      throw new Error('No frames available for video generation');
    }

    try {
      const videoDirectory = FileSystem.documentDirectory + "videos/";
      const timestamp = Date.now();

      // Ensure directory exists
      const dirInfo = await FileSystem.getInfoAsync(videoDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(videoDirectory, {
          intermediates: true,
        });
      }

      // Create organized frame sequence for potential server-side processing
      const sequenceDirectory = `${videoDirectory}sequence_${timestamp}/`;
      await FileSystem.makeDirectoryAsync(sequenceDirectory, {
        intermediates: true,
      });

      // Copy and organize frames with proper naming
      const framePromises = frames.map(async (frame, index) => {
        const paddedIndex = String(index).padStart(4, '0');
        const frameFileName = `frame_${paddedIndex}.${this.recordingOptions.format}`;
        const framePath = sequenceDirectory + frameFileName;
        
        if (frame.uri.startsWith('data:')) {
          // Handle data URI frames
          const base64Data = frame.uri.split(',')[1];
          await FileSystem.writeAsStringAsync(framePath, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } else {
          // Handle file URI frames
          await FileSystem.copyAsync({
            from: frame.uri,
            to: framePath,
          });
        }
        
        return framePath;
      });

      await Promise.all(framePromises);

      // Create manifest for video processing
      const manifest = {
        frameCount: frames.length,
        fps: this.recordingOptions.fps,
        duration: frames.length / this.recordingOptions.fps,
        quality: this.recordingOptions.quality,
        format: this.recordingOptions.format,
        createdAt: new Date().toISOString(),
        frames: frames.map((frame, index) => ({
          index,
          timestamp: frame.timestamp,
          filename: `frame_${String(index).padStart(4, '0')}.${this.recordingOptions.format}`
        }))
      };

      const manifestPath = sequenceDirectory + 'manifest.json';
      await FileSystem.writeAsStringAsync(
        manifestPath,
        JSON.stringify(manifest, null, 2)
      );

      // TODO: Implement server-side video processing
      // For now, create a shareable image sequence package
      const packageInfo = {
        type: 'image-sequence',
        directory: sequenceDirectory,
        manifest: manifestPath,
        frameCount: frames.length,
        duration: frames.length / this.recordingOptions.fps,
        readyForProcessing: true
      };

      const packageInfoPath = `${videoDirectory}package_${timestamp}.json`;
      await FileSystem.writeAsStringAsync(
        packageInfoPath,
        JSON.stringify(packageInfo, null, 2)
      );

      return packageInfoPath;
    } catch (error) {
      this.handleError(error as Error, 'create video from frames');
      throw error;
    }
  }

  async cleanupFrames(frames: FrameData[]): Promise<void> {
    try {
      await Promise.all(
        frames.map((frame) =>
          FileSystem.deleteAsync(frame.uri, { idempotent: true })
        )
      );
    } catch (error) {
      console.error("Frame cleanup failed:", error);
    }
  }

  getRecordingStats() {
    return {
      frameCount: this.frames.length,
      isRecording: this.isRecording,
      estimatedDuration: this.frames.length / this.recordingOptions.fps,
      estimatedFileSize: this.frames.length * 0.5, // Rough estimate in MB
    };
  }

  async processVideoOnServer(packageInfoPath: string): Promise<string> {
    // TODO: Implement server-side video processing
    // This method will upload the frame sequence to a server for video processing
    throw new Error('Server-side video processing not implemented yet. Please use the image sequence package for manual processing.');
  }

  async createVideoPreview(frames: FrameData[]): Promise<string> {
    if (frames.length === 0) {
      throw new Error('No frames available for preview');
    }

    try {
      const videoDirectory = FileSystem.documentDirectory + "videos/";
      const previewFileName = `preview_${Date.now()}.${this.recordingOptions.format}`;
      const previewPath = videoDirectory + previewFileName;

      // Use the middle frame as preview
      const middleFrameIndex = Math.floor(frames.length / 2);
      const middleFrame = frames[middleFrameIndex];

      if (middleFrame.uri.startsWith('data:')) {
        const base64Data = middleFrame.uri.split(',')[1];
        await FileSystem.writeAsStringAsync(previewPath, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } else {
        await FileSystem.copyAsync({
          from: middleFrame.uri,
          to: previewPath,
        });
      }

      return previewPath;
    } catch (error) {
      this.handleError(error as Error, 'create video preview');
      throw error;
    }
  }
}
