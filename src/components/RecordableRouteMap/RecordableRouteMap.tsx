import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { Button } from "react-native-paper";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { Route } from "../../types/Route";
import {
  FrameCaptureService,
  FrameCaptureOptions,
} from "../../services/FrameCaptureService";
import { VideoRecordingService } from "../../services/VideoRecordingService";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";

// Constants
const ANIMATION_SPEED = 3000; // 3000ms between waypoints
const FRAME_CAPTURE_INTERVAL = 1000 / 30; // 30fps = ~33.33ms between frames
const TOTAL_FRAMES_PER_WAYPOINT = 30; // 1 second of footage per waypoint

// Types
interface FrameCaptureStatus {
  isCapturing: boolean;
  progress: number;
  framesCount: number;
  error: string | null;
}

interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface Props {
  route: Route;
  onVideoCreated?: (videoUri: string) => void;
  frameCaptureOptions?: Partial<FrameCaptureOptions>;
}

export const RecordableRouteMap: React.FC<Props> = ({
  route,
  onVideoCreated,
  frameCaptureOptions,
}) => {
  // State
  const [isRecording, setIsRecording] = useState(false);
  const [processingVideo, setProcessingVideo] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mapRegion, setMapRegion] = useState<MapRegion>({
    latitude: route.waypoints[0]?.coordinate.latitude || 37.78825,
    longitude: route.waypoints[0]?.coordinate.longitude || -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [frameCaptureStatus, setFrameCaptureStatus] =
    useState<FrameCaptureStatus>({
      isCapturing: false,
      progress: 0,
      framesCount: 0,
      error: null,
    });

  // Refs
  const mapRef = useRef<MapView>(null);
  const frameCaptureServiceRef = useRef<FrameCaptureService>(
    new FrameCaptureService({
      fps: 30,
      quality: 1.0,
      format: "png",
      ...frameCaptureOptions,
    })
  );
  const videoServiceRef = useRef(
    new VideoRecordingService({
      fps: 30,
      duration: 10,
      quality: 0.9,
    })
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const frameCaptureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCapturingRef = useRef(false);

  // Calculate region that fits all waypoints
  const getRouteRegion = useCallback((): MapRegion | null => {
    if (route.waypoints.length === 0) return null;

    const coordinates = route.waypoints.map((wp) => wp.coordinate);
    const minLat = Math.min(...coordinates.map((c) => c.latitude));
    const maxLat = Math.max(...coordinates.map((c) => c.latitude));
    const minLng = Math.min(...coordinates.map((c) => c.longitude));
    const maxLng = Math.max(...coordinates.map((c) => c.longitude));

    const latDelta = (maxLat - minLat) * 1.2;
    const lngDelta = (maxLng - minLng) * 1.2;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  }, [route.waypoints]);

  // Fit map to show entire route
  const fitToRoute = useCallback(() => {
    const region = getRouteRegion();
    if (region && mapRef.current) {
      mapRef.current.animateToRegion(region, 1000);
    }
  }, [getRouteRegion]);

  // Animate to specific waypoint
  const animateToWaypoint = useCallback(
    (index: number, duration: number = 1000) => {
      if (index >= route.waypoints.length) return;

      const waypoint = route.waypoints[index];

      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: waypoint.coordinate.latitude,
            longitude: waypoint.coordinate.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          duration
        );

        setMapRegion({
          latitude: waypoint.coordinate.latitude,
          longitude: waypoint.coordinate.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    },
    [route.waypoints]
  );

  // Capture a single frame
  const captureFrame = useCallback(
    async (index: number) => {
      if (!isCapturingRef.current || !mapRef.current) {
        return;
      }

      try {
        const frameService = frameCaptureServiceRef.current;
        const totalFrames = route.waypoints.length * TOTAL_FRAMES_PER_WAYPOINT;

        const frame = await frameService.captureFrame(
          mapRef.current,
          index,
          totalFrames
        );

        if (frame) {
          setFrameCaptureStatus((prev) => ({
            ...prev,
            framesCount: prev.framesCount + 1,
            progress: (index + 1) / totalFrames,
          }));

          setRecordingProgress((index + 1) / totalFrames);
        }
      } catch (error) {
        console.error("Error capturing frame:", error);
        setFrameCaptureStatus((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error during frame capture",
        }));
      }
    },
    [route.waypoints.length]
  );

  // Start frame capture and animation
  const startFrameCapture = useCallback(async (): Promise<boolean> => {
    try {
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Media library permission is needed to save frames"
        );
        return false;
      }

      const frameService = frameCaptureServiceRef.current;
      await frameService.startCapture();

      setFrameCaptureStatus({
        isCapturing: true,
        progress: 0,
        framesCount: 0,
        error: null,
      });
      isCapturingRef.current = true;

      // Reset to start
      setCurrentIndex(0);
      let frameCount = 0;
      const totalFrames = route.waypoints.length * TOTAL_FRAMES_PER_WAYPOINT;

      // Start continuous frame capture at 30fps
      frameCaptureIntervalRef.current = setInterval(async () => {
        if (mapRef.current && isCapturingRef.current) {
          await captureFrame(frameCount);
          frameCount++;

          // Stop if we've captured all frames
          if (frameCount >= totalFrames) {
            if (frameCaptureIntervalRef.current) {
              clearInterval(frameCaptureIntervalRef.current);
            }
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            await stopFrameCapture();
          }
        }
      }, FRAME_CAPTURE_INTERVAL);

      // Start waypoint animation
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          if (prevIndex < route.waypoints.length - 1) {
            const newIndex = prevIndex + 1;
            animateToWaypoint(newIndex, ANIMATION_SPEED);
            return newIndex;
          } else {
            // Animation complete, wait 300ms before stopping
            setTimeout(() => {
              if (frameCaptureIntervalRef.current) {
                clearInterval(frameCaptureIntervalRef.current);
              }
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
              }
              stopFrameCapture();
            }, 300);
            return prevIndex;
          }
        });
      }, ANIMATION_SPEED);

      return true;
    } catch (error) {
      console.error("Failed to start frame capture:", error);
      setFrameCaptureStatus({
        isCapturing: false,
        progress: 0,
        framesCount: 0,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error starting frame capture",
      });
      isCapturingRef.current = false;
      return false;
    }
  }, [route.waypoints.length, animateToWaypoint, captureFrame]);

  // Stop frame capture
  const stopFrameCapture = useCallback(async (): Promise<any[]> => {
    try {
      const frameService = frameCaptureServiceRef.current;
      const frames = await frameService.stopCapture();

      setFrameCaptureStatus((prev) => ({
        ...prev,
        isCapturing: false,
        framesCount: frames.length,
      }));
      isCapturingRef.current = false;

      return frames;
    } catch (error) {
      console.error("Failed to stop frame capture:", error);
      setFrameCaptureStatus((prev) => ({
        ...prev,
        isCapturing: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error stopping frame capture",
      }));
      return [];
    }
  }, []);

  // Get frame capture directory
  const getFrameCaptureDirectory = useCallback(async (): Promise<
    string | null
  > => {
    try {
      return await frameCaptureServiceRef.current.exportFrameDirectory();
    } catch (error) {
      console.error("Failed to get frame directory:", error);
      return null;
    }
  }, []);

  // Toggle recording
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      await stopRecording();
      return;
    }

    if (!route?.waypoints?.length) {
      Alert.alert("Error", "No waypoints available to record");
      return;
    }

    if (route.waypoints.length < 2) {
      Alert.alert("Error", "Add at least 2 waypoints to record");
      return;
    }

    try {
      setIsRecording(true);
      const success = await startFrameCapture();
      if (!success) {
        setIsRecording(false);
        Alert.alert("Error", "Failed to start recording");
      }
    } catch (error) {
      console.error("Error starting recording:", error);
      setIsRecording(false);
      Alert.alert("Recording Error", "Failed to start recording");
    }
  }, [isRecording, route.waypoints, startFrameCapture]);

  // Stop recording and process video
  const stopRecording = useCallback(async () => {
    if (!isRecording) return;

    try {
      setProcessingVideo(true);

      const frames = await stopFrameCapture();
      console.log(`Captured ${frames.length} frames`);

      if (frames.length > 0) {
        // Create a video from the frames
        const videoUri = await videoServiceRef.current.createVideoFromFrames(
          frames
        );

        // Cleanup frames
        await videoServiceRef.current.cleanupFrames(frames);

        // Call the callback with the video URI
        if (onVideoCreated) {
          onVideoCreated(videoUri);
        }

        Alert.alert("Success", "Video created successfully!");
      }
    } catch (error) {
      console.error("Video creation failed:", error);
      Alert.alert("Error", "Failed to create video");
    } finally {
      setIsRecording(false);
      setProcessingVideo(false);
      setRecordingProgress(0);
    }
  }, [isRecording, onVideoCreated]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (frameCaptureIntervalRef.current) {
        clearInterval(frameCaptureIntervalRef.current);
      }
      if (frameCaptureStatus.isCapturing) {
        frameCaptureServiceRef.current.stopCapture().catch(console.error);
      }
    };
  }, [frameCaptureStatus.isCapturing]);

  // Debug logging
  useEffect(() => {
    console.log("Route data:", {
      hasRoute: !!route,
      waypointCount: route?.waypoints?.length || 0,
      isRecording,
      processingVideo,
    });
  }, [route, isRecording, processingVideo]);

  if (route.waypoints.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text>No waypoints in this route</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={mapRegion}
          showsUserLocation={false}
          onLayout={fitToRoute}
        >
          {/* Polyline showing full route */}
          <Polyline
            coordinates={route.waypoints.map((wp) => wp.coordinate)}
            strokeColor="#FF6B35"
            strokeWidth={4}
          />

          {/* All waypoint markers */}
          {route.waypoints.map((waypoint, index) => (
            <Marker
              key={waypoint.id}
              coordinate={waypoint.coordinate}
              title={waypoint.name || `Waypoint ${index + 1}`}
              pinColor={index === currentIndex ? "red" : "blue"}
            />
          ))}

          {/* Current position marker */}
          {route.waypoints[currentIndex] && (
            <Marker
              coordinate={route.waypoints[currentIndex].coordinate}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={[styles.currentMarker, { opacity: 1 }]} />
            </Marker>
          )}
        </MapView>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={toggleRecording}
          disabled={processingVideo || !route?.waypoints?.length}
          icon={isRecording ? "stop" : "video"}
          style={[
            styles.recordButton,
            isRecording && { backgroundColor: "#ff4444" },
          ]}
        >
          {processingVideo
            ? "Processing..."
            : isRecording
            ? "Stop Recording"
            : "Record Route"}
        </Button>
      </View>

      {/* Recording progress indicator */}
      {isRecording && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Recording: {Math.round(recordingProgress * 100)}%
          </Text>
          <Text style={styles.progressText}>
            Frames: {frameCaptureStatus.framesCount}
          </Text>
        </View>
      )}

      {/* Error display */}
      {frameCaptureStatus.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Error: {frameCaptureStatus.error}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  mapContainer: {
    flex: 1,
    width: "100%",
  },
  map: {
    flex: 1,
    width: "100%",
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  recordButton: {
    backgroundColor: "#4CAF50",
  },
  progressContainer: {
    padding: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  progressText: {
    fontSize: 12,
    color: "#666",
  },
  errorContainer: {
    padding: 8,
    backgroundColor: "#ffebee",
    alignItems: "center",
  },
  errorText: {
    fontSize: 12,
    color: "#c62828",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  currentMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF6B35",
    borderWidth: 3,
    borderColor: "white",
  },
});
