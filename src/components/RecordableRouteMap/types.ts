import { MutableRefObject } from "react";
import { View } from "react-native";
import { Route } from "@types/Route";
import { VideoRecordingService } from "@services/VideoRecordingService";

export type TProps = {
  route: Route;
  onVideoCreated?: (videoUri: string) => void;
};

export type TController = {
  isRecording: boolean;
  recordingProgress: number;
  processingVideo: boolean;
  mapRef: MutableRefObject<View | null>;
  videoService: VideoRecordingService;
  startRecording: () => Promise<void>;
  setIsRecording: (recording: boolean) => void;
  handleFrameCapture: (frameData: any) => Promise<void>;
};
