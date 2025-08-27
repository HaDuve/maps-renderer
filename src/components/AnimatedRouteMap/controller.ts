import { useState, useRef, useEffect } from "react";
import MapView from "react-native-maps";
import { TProps, TController, FrameCaptureStatus } from "./types";
import {
  FrameCaptureService,
  FrameCaptureOptions,
  FrameCaptureProgress,
} from "@services/FrameCaptureService";

export const useController = (props: TProps): TController => {
  const {
    route,
    onFrameCapture,
    isRecording = false,
    frameCaptureOptions,
  } = props;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const mapRef = useRef<MapView>(null);

  const [mapRegion, setMapRegion] = useState({
    latitude: route.waypoints[0]?.coordinate.latitude || 37.78825,
    longitude: route.waypoints[0]?.coordinate.longitude || -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  const [progress, setProgress] = useState(0);
  const [frameCaptureStatus, setFrameCaptureStatus] =
    useState<FrameCaptureStatus>({
      isCapturing: false,
      progress: 0,
      framesCount: 0,
      error: null,
    });

  // Initialize the frame capture service
  const frameCaptureServiceRef = useRef<FrameCaptureService>(
    new FrameCaptureService(frameCaptureOptions)
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate region that fits all waypoints
  const getRouteRegion = () => {
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
  };

  const animateToWaypoint = (index: number, duration: number = 1000) => {
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
        duration / animationSpeed
      );

      setMapRegion({
        latitude: waypoint.coordinate.latitude,
        longitude: waypoint.coordinate.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // Trigger frame capture if recording
      if (isRecording) {
        captureFrame(index);

        if (onFrameCapture) {
          onFrameCapture({ index, waypoint });
        }
      }
    }
  };

  const startAnimation = () => {
    if (isPlaying) {
      stopAnimation();
      return;
    }

    setIsPlaying(true);

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        if (prevIndex < route.waypoints.length - 1) {
          const newIndex = prevIndex + 1;
          animateToWaypoint(newIndex, 500);
          setProgress(newIndex / (route.waypoints.length - 1));
          return newIndex;
        } else {
          // Animation complete
          stopAnimation();
          return 0; // Reset to beginning
        }
      });
    }, 500 / animationSpeed);
  };

  const stopAnimation = () => {
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleSliderChange = (value: number) => {
    const index = Math.round(value);
    setCurrentIndex(index);
    animateToWaypoint(index, 300);
    setProgress(value / (route.waypoints.length - 1));

    if (isPlaying) {
      stopAnimation();
    }
  };

  const fitToRoute = () => {
    const region = getRouteRegion();
    if (region && mapRef.current) {
      mapRef.current.animateToRegion(region, 1000);
    }
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Frame capture related methods
  const captureFrame = async (index: number) => {
    if (!frameCaptureStatus.isCapturing || !mapRef.current) return;

    try {
      const frameService = frameCaptureServiceRef.current;
      const totalFrames = route.waypoints.length;
      await frameService.captureFrame(mapRef.current, index, totalFrames);
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
  };

  const startFrameCapture = async () => {
    try {
      const frameService = frameCaptureServiceRef.current;
      await frameService.startCapture();

      // Set up progress tracking
      frameService.setProgressCallback((progress: FrameCaptureProgress) => {
        setFrameCaptureStatus((prev) => ({
          ...prev,
          progress: progress.percentage,
          framesCount: progress.current,
        }));
      });

      setFrameCaptureStatus({
        isCapturing: true,
        progress: 0,
        framesCount: 0,
        error: null,
      });

      // Capture the current frame immediately
      captureFrame(currentIndex);

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
      return false;
    }
  };

  const stopFrameCapture = async () => {
    try {
      const frameService = frameCaptureServiceRef.current;
      const frames = await frameService.stopCapture();

      setFrameCaptureStatus((prev) => ({
        ...prev,
        isCapturing: false,
        framesCount: frames.length,
      }));

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
  };

  const getFrameCaptureDirectory = async () => {
    try {
      return await frameCaptureServiceRef.current.exportFrameDirectory();
    } catch (error) {
      console.error("Failed to get frame directory:", error);
      return null;
    }
  };

  // Effect to clean up frame capture service on component unmount
  useEffect(() => {
    return () => {
      if (frameCaptureStatus.isCapturing) {
        frameCaptureServiceRef.current.stopCapture().catch(console.error);
      }
    };
  }, [frameCaptureStatus.isCapturing]);

  return {
    isPlaying,
    currentIndex,
    animationSpeed,
    setAnimationSpeed,
    mapRef,
    progress,
    intervalRef,
    mapRegion,
    getRouteRegion,
    animateToWaypoint,
    startAnimation,
    stopAnimation,
    handleSliderChange,
    fitToRoute,
    // Frame capture methods
    frameCaptureStatus,
    startFrameCapture,
    stopFrameCapture,
    captureFrame,
    getFrameCaptureDirectory,
  };
};
