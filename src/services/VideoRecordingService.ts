import { captureRef } from "react-native-view-shot";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { Alert } from "react-native";

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
    console.log("Recording started");
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
      console.log(`Captured frame ${frameIndex + 1}`);
    } catch (error) {
      console.error("Frame capture failed:", error);
      throw error;
    }
  }

  async stopRecording(): Promise<FrameData[]> {
    this.isRecording = false;
    console.log(`Recording stopped. Captured ${this.frames.length} frames`);
    return [...this.frames];
  }

  async createVideoFromFrames(frames: FrameData[]): Promise<string> {
    // For Expo managed workflow, this would typically require:
    // 1. Server-side processing with FFmpeg
    // 2. Or using a third-party service
    // 3. Or creating a GIF from frames (simpler alternative)

    // Simplified implementation: Create a GIF-like sequence
    const videoDirectory = FileSystem.documentDirectory + "videos/";

    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(videoDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(videoDirectory, {
        intermediates: true,
      });
    }

    // For now, create a placeholder image if there are no frames
    const videoFileName = `route_video_${Date.now()}.png`;
    const videoPath = videoDirectory + videoFileName;

    if (frames.length > 0) {
      // Copy first frame as placeholder
      await FileSystem.copyAsync({
        from: frames[0].uri,
        to: videoPath,
      });
    } else {
      // Create a placeholder file for demo purposes
      const placeholderText =
        "This is a placeholder for video recording.\n" +
        "In a production app, this would be an actual video file.\n" +
        "Timestamp: " +
        new Date().toISOString();

      await FileSystem.writeAsStringAsync(videoPath, placeholderText);
    }

    return videoPath;
  }

  async cleanupFrames(frames: FrameData[]): Promise<void> {
    try {
      await Promise.all(
        frames.map((frame) =>
          FileSystem.deleteAsync(frame.uri, { idempotent: true })
        )
      );
      console.log("Cleaned up temporary frame files");
    } catch (error) {
      console.warn("Frame cleanup failed:", error);
    }
  }

  getRecordingStats() {
    return {
      frameCount: this.frames.length,
      isRecording: this.isRecording,
      estimatedDuration: this.frames.length / this.recordingOptions.fps,
    };
  }
}
