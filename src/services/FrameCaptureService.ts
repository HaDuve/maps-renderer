import { captureRef } from "react-native-view-shot";
import * as FileSystem from "expo-file-system";
import { Alert } from "react-native";

export interface FrameCaptureOptions {
  fps: number;
  quality: number; // 0.0 to 1.0
  format: "png" | "jpg";
  width?: number;
  height?: number;
}

export interface CapturedFrame {
  uri: string;
  index: number;
  timestamp: number;
}

export interface FrameCaptureProgress {
  total: number;
  current: number;
  percentage: number;
}

export class FrameCaptureService {
  private isCapturing: boolean = false;
  private capturedFrames: CapturedFrame[] = [];
  private options: FrameCaptureOptions;
  private tempDirectory: string;
  private onProgressCallback?: (progress: FrameCaptureProgress) => void;

  constructor(options: Partial<FrameCaptureOptions> = {}) {
    this.options = {
      fps: 30,
      quality: 1.0, // Use maximum quality for best results
      format: "png",
      ...options,
    };

    // Create a directory path for storing frames
    this.tempDirectory = `${
      FileSystem.cacheDirectory
    }frame_capture_${Date.now()}/`;
  }

  async initialize(): Promise<void> {
    // Ensure the temp directory exists
    const dirInfo = await FileSystem.getInfoAsync(this.tempDirectory);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(this.tempDirectory, {
        intermediates: true,
      });
    }

    this.capturedFrames = [];
    this.isCapturing = false;
  }

  async startCapture(): Promise<void> {
    if (this.isCapturing) {
      throw new Error("Frame capture already in progress");
    }

    try {
      await this.initialize();
      this.isCapturing = true;
      console.log("Frame capture started");
    } catch (error) {
      console.error("Failed to start frame capture:", error);
      throw error;
    }
  }

  setProgressCallback(
    callback: (progress: FrameCaptureProgress) => void
  ): void {
    this.onProgressCallback = callback;
  }

  async captureFrame(
    viewRef: any,
    index: number,
    totalFrames: number
  ): Promise<CapturedFrame | null> {
    if (!this.isCapturing) return null;

    try {
      // Generate a formatted frame number for sequential naming
      const frameNumber = String(index).padStart(4, "0");
      const fileName = `frame_${frameNumber}.${this.options.format}`;
      const filePath = `${this.tempDirectory}${fileName}`;

      // Capture the view with high quality settings
      // Use default dimensions since measuring Google Maps view is unreliable
      const defaultDimensions = {
        width: 1024,
        height: 1024,
      };

      const uri = await captureRef(viewRef, {
        format: this.options.format,
        quality: this.options.quality,
        result: "data-uri",
        width: defaultDimensions.width,
        height: defaultDimensions.height,
        snapshotContentContainer: false, // Don't use snapshotContentContainer for map views
      });

      // Save the data URI to file
      if (uri.startsWith("data:")) {
        // Extract base64 data from data URI
        const base64Data = uri.split(",")[1];
        // Write to file
        await FileSystem.writeAsStringAsync(filePath, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      const frame: CapturedFrame = {
        uri,
        index,
        timestamp: Date.now(),
      };

      this.capturedFrames.push(frame);

      // Report progress
      if (this.onProgressCallback && totalFrames > 0) {
        const progress: FrameCaptureProgress = {
          total: totalFrames,
          current: index + 1,
          percentage: (index + 1) / totalFrames,
        };
        this.onProgressCallback(progress);
      }

      return frame;
    } catch (error) {
      console.error(`Failed to capture frame ${index}:`, error);
      return null;
    }
  }

  async stopCapture(): Promise<CapturedFrame[]> {
    if (!this.isCapturing) {
      return [];
    }

    this.isCapturing = false;
    console.log(
      `Frame capture completed. Captured ${this.capturedFrames.length} frames`
    );
    return [...this.capturedFrames];
  }

  async cleanupFrames(): Promise<void> {
    try {
      await FileSystem.deleteAsync(this.tempDirectory, { idempotent: true });
      this.capturedFrames = [];
      console.log("Cleaned up temporary frame files");
    } catch (error) {
      console.warn("Frame cleanup failed:", error);
    }
  }

  getFrameFilesInfo(): {
    count: number;
    directory: string;
    isCapturing: boolean;
  } {
    return {
      count: this.capturedFrames.length,
      directory: this.tempDirectory,
      isCapturing: this.isCapturing,
    };
  }

  async exportFrameDirectory(): Promise<string> {
    // Create a manifest file with information about captured frames
    const manifestPath = `${this.tempDirectory}manifest.json`;
    const manifest = {
      frameCount: this.capturedFrames.length,
      fps: this.options.fps,
      format: this.options.format,
      captureDate: new Date().toISOString(),
      frames: this.capturedFrames.map((frame) => ({
        index: frame.index,
        filename: frame.uri.split("/").pop(),
        timestamp: frame.timestamp,
      })),
    };

    await FileSystem.writeAsStringAsync(
      manifestPath,
      JSON.stringify(manifest, null, 2)
    );

    return this.tempDirectory;
  }
}
