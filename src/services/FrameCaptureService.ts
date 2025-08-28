import { captureRef } from "react-native-view-shot";
import * as FileSystem from "expo-file-system";
import { useRef, useCallback, useState } from "react";

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

export interface FrameCaptureState {
  isCapturing: boolean;
  capturedFrames: CapturedFrame[];
  progress: FrameCaptureProgress;
  error: string | null;
  tempDirectory: string | null;
}

export interface FrameCaptureActions {
  startCapture: (options?: Partial<FrameCaptureOptions>) => Promise<void>;
  captureFrame: (
    viewRef: any,
    index: number,
    totalFrames: number
  ) => Promise<CapturedFrame | null>;
  stopCapture: () => Promise<CapturedFrame[]>;
  cleanupFrames: () => Promise<void>;
  exportFrameDirectory: () => Promise<string | null>;
  getFrameFilesInfo: () => {
    count: number;
    directory: string;
    isCapturing: boolean;
  };
}

export interface UseFrameCaptureReturn
  extends FrameCaptureState,
    FrameCaptureActions {
  setProgressCallback: (
    callback: (progress: FrameCaptureProgress) => void
  ) => void;
  updateOptions: (newOptions: Partial<FrameCaptureOptions>) => void;
}

// Default options for frame capture
const DEFAULT_FRAME_CAPTURE_OPTIONS: FrameCaptureOptions = {
  fps: 30,
  quality: 1.0,
  format: "png",
  width: 1024,
  height: 1024,
};

/**
 * Custom hook for frame capture functionality
 * Follows React Native guidelines with functional approach
 */
export const useFrameCapture = (
  initialOptions?: Partial<FrameCaptureOptions>
): UseFrameCaptureReturn => {
  // State management using React hooks
  const [state, setState] = useState<FrameCaptureState>({
    isCapturing: false,
    capturedFrames: [],
    progress: { total: 0, current: 0, percentage: 0 },
    error: null,
    tempDirectory: null,
  });

  // Refs for mutable values that don't trigger re-renders
  const optionsRef = useRef<FrameCaptureOptions>({
    ...DEFAULT_FRAME_CAPTURE_OPTIONS,
    ...initialOptions,
  });
  const onProgressCallbackRef = useRef<
    ((progress: FrameCaptureProgress) => void) | null
  >(null);

  // Update options
  const updateOptions = useCallback(
    (newOptions: Partial<FrameCaptureOptions>) => {
      optionsRef.current = { ...optionsRef.current, ...newOptions };
    },
    []
  );

  // Set progress callback
  const setProgressCallback = useCallback(
    (callback: (progress: FrameCaptureProgress) => void) => {
      onProgressCallbackRef.current = callback;
    },
    []
  );

  // Initialize frame capture
  const initialize = useCallback(async (): Promise<void> => {
    const tempDirectory = `${
      FileSystem.cacheDirectory
    }frame_capture_${Date.now()}/`;

    try {
      const dirInfo = await FileSystem.getInfoAsync(tempDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(tempDirectory, {
          intermediates: true,
        });
      }

      setState((prev) => ({
        ...prev,
        tempDirectory,
        capturedFrames: [],
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to initialize frame capture",
      }));
      throw error;
    }
  }, []);

  // Start frame capture
  const startCapture = useCallback(
    async (newOptions?: Partial<FrameCaptureOptions>): Promise<void> => {
      if (state.isCapturing) {
        throw new Error("Frame capture already in progress");
      }

      try {
        // Update options if provided
        if (newOptions) {
          updateOptions(newOptions);
        }

        await initialize();

        setState((prev) => ({
          ...prev,
          isCapturing: true,
          error: null,
        }));

        console.log("Frame capture started");
      } catch (error) {
        console.error("Failed to start frame capture:", error);
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error starting frame capture",
        }));
        throw error;
      }
    },
    [state.isCapturing, initialize, updateOptions]
  );

  // Capture a single frame
  const captureFrame = useCallback(
    async (
      viewRef: any,
      index: number,
      totalFrames: number
    ): Promise<CapturedFrame | null> => {
      console.log(`🔍 useFrameCapture.captureFrame called with:`, {
        index,
        totalFrames,
        isCapturing: state.isCapturing,
        hasViewRef: !!viewRef,
      });

      if (!state.isCapturing || !state.tempDirectory) {
        console.log("❌ Frame capture conditions not met:", {
          isCapturing: state.isCapturing,
          hasTempDirectory: !!state.tempDirectory,
        });
        return null;
      }

      try {
        const options = optionsRef.current;

        // Generate a formatted frame number for sequential naming
        const frameNumber = String(index).padStart(4, "0");
        const fileName = `frame_${frameNumber}.${options.format}`;
        const filePath = `${state.tempDirectory}${fileName}`;

        console.log(`📁 Saving frame to: ${filePath}`);

        console.log(
          "📸 Attempting to capture view with react-native-view-shot..."
        );
        const uri = await captureRef(viewRef, {
          format: options.format,
          quality: options.quality,
          result: "data-uri",
          width: options.width,
          height: options.height,
          snapshotContentContainer: false, // Don't use snapshotContentContainer for map views
        });

        console.log(
          "✅ View captured successfully, URI length:",
          uri?.length || 0
        );
        console.log("📸 Frame data preview:", uri?.substring(0, 50) + "...");

        // Save the data URI to file
        if (uri.startsWith("data:")) {
          // Extract base64 data from data URI
          const base64Data = uri.split(",")[1];
          console.log("💾 Writing base64 data to file...");

          await FileSystem.writeAsStringAsync(filePath, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          console.log("💾 File written successfully");
        } else {
          console.log(
            "⚠️ URI doesn't start with 'data:', URI:",
            uri?.substring(0, 50)
          );
        }

        const frame: CapturedFrame = {
          uri,
          index,
          timestamp: Date.now(),
        };

        // Update state with new frame
        setState((prev) => {
          const newCapturedFrames = [...prev.capturedFrames, frame];
          const newProgress = {
            total: totalFrames,
            current: index + 1,
            percentage: (index + 1) / totalFrames,
          };

          console.log(
            `📊 Frame ${index} added to capturedFrames array, total: ${newCapturedFrames.length}`
          );
          console.log(`📄 Frame ${index} metadata:`, {
            index: frame.index,
            timestamp: frame.timestamp,
            uriLength: frame.uri?.length || 0,
          });

          // Report progress via callback if provided
          if (onProgressCallbackRef.current) {
            onProgressCallbackRef.current(newProgress);
          }

          return {
            ...prev,
            capturedFrames: newCapturedFrames,
            progress: newProgress,
          };
        });

        console.log(`✅ Frame ${index} captured and processed successfully`);
        return frame;
      } catch (error) {
        console.error(`❌ Failed to capture frame ${index}:`, error);
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error during frame capture",
        }));
        return null;
      }
    },
    [state.isCapturing, state.tempDirectory]
  );

  // Stop frame capture
  const stopCapture = useCallback(async (): Promise<CapturedFrame[]> => {
    if (!state.isCapturing) {
      return [];
    }

    setState((prev) => ({
      ...prev,
      isCapturing: false,
    }));

    console.log(
      `Frame capture completed. Captured ${state.capturedFrames.length} frames`
    );

    return [...state.capturedFrames];
  }, [state.isCapturing, state.capturedFrames.length]);

  // Cleanup frames
  const cleanupFrames = useCallback(async (): Promise<void> => {
    try {
      if (state.tempDirectory) {
        await FileSystem.deleteAsync(state.tempDirectory, { idempotent: true });
      }

      setState((prev) => ({
        ...prev,
        capturedFrames: [],
        tempDirectory: null,
      }));

      console.log("Cleaned up temporary frame files");
    } catch (error) {
      console.warn("Frame cleanup failed:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Frame cleanup failed",
      }));
    }
  }, [state.tempDirectory]);

  // Get frame files info
  const getFrameFilesInfo = useCallback((): {
    count: number;
    directory: string;
    isCapturing: boolean;
  } => {
    return {
      count: state.capturedFrames.length,
      directory: state.tempDirectory || "",
      isCapturing: state.isCapturing,
    };
  }, [state.capturedFrames.length, state.tempDirectory, state.isCapturing]);

  // Export frame directory
  const exportFrameDirectory = useCallback(async (): Promise<string | null> => {
    if (!state.tempDirectory || state.capturedFrames.length === 0) {
      return null;
    }

    try {
      // Create a manifest file with information about captured frames
      const manifestPath = `${state.tempDirectory}manifest.json`;
      const manifest = {
        frameCount: state.capturedFrames.length,
        fps: optionsRef.current.fps,
        format: optionsRef.current.format,
        captureDate: new Date().toISOString(),
        frames: state.capturedFrames.map((frame) => ({
          index: frame.index,
          filename: frame.uri.split("/").pop(),
          timestamp: frame.timestamp,
        })),
      };

      await FileSystem.writeAsStringAsync(
        manifestPath,
        JSON.stringify(manifest, null, 2)
      );

      return state.tempDirectory;
    } catch (error) {
      console.error("Failed to export frame directory:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to export frame directory",
      }));
      return null;
    }
  }, [state.tempDirectory, state.capturedFrames]);

  return {
    // State
    ...state,

    // Actions
    startCapture,
    captureFrame,
    stopCapture,
    cleanupFrames,
    exportFrameDirectory,
    getFrameFilesInfo,

    // Additional utilities
    setProgressCallback,
    updateOptions,
  };
};
