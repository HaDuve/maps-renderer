import { RefObject } from "react";
import MapView from "react-native-maps";
import { Route } from "../../types/Route";
import { FrameCaptureOptions } from "@services/FrameCaptureService";

export type TProps = {
  route: Route;
  onFrameCapture?: (frameData: any) => void;
  isRecording?: boolean;
  frameCaptureOptions?: Partial<FrameCaptureOptions>;
};

export interface FrameCaptureStatus {
  isCapturing: boolean;
  progress: number;
  framesCount: number;
  error: string | null;
}

export type TController = {
  isPlaying: boolean;
  currentIndex: number;
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
  mapRef: RefObject<MapView | null>;
  progress: number;
  intervalRef: RefObject<NodeJS.Timeout | null>;
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
  // Frame capture methods
  frameCaptureStatus: FrameCaptureStatus;
  startFrameCapture: () => Promise<boolean>;
  stopFrameCapture: () => Promise<any[]>;
  captureFrame: (index: number) => Promise<void>;
  getFrameCaptureDirectory: () => Promise<string | null>;
};
