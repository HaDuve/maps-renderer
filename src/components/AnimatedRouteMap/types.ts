import { MutableRefObject } from "react";
import MapView from "react-native-maps";
import { Route } from "../../types/Route";

export type TProps = {
  route: Route;
  onFrameCapture?: (frameData: any) => void;
  isRecording?: boolean;
};

export type TController = {
  isPlaying: boolean;
  currentIndex: number;
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
  mapRef: MutableRefObject<MapView | null>;
  progress: number;
  intervalRef: MutableRefObject<NodeJS.Timeout | null>;
  mapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  getRouteRegion: () => {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null;
  animateToWaypoint: (index: number, duration?: number) => void;
  startAnimation: () => void;
  stopAnimation: () => void;
  handleSliderChange: (value: number) => void;
  fitToRoute: () => void;
};
