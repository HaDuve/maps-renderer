import { useState, useRef, useEffect } from "react";
import MapView from "react-native-maps";
import { TProps, TController } from "./types";

export const useController = (props: TProps): TController => {
  const { route, onFrameCapture, isRecording = false } = props;

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
      if (isRecording && onFrameCapture) {
        onFrameCapture({ index, waypoint });
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
  };
};
