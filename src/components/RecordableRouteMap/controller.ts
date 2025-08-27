import { useRef, useState } from "react";
import { View, Alert } from "react-native";
import { VideoRecordingService } from "@services/VideoRecordingService";
import { TProps, TController } from "./types";

export const useController = ({
  route,
  onVideoCreated,
}: TProps): TController => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [processingVideo, setProcessingVideo] = useState(false);

  const mapRef = useRef<View | null>(null);
  const videoService = useRef(
    new VideoRecordingService({
      fps: 30,
      duration: 10,
      quality: 0.9,
    })
  ).current;

  const startRecording = async () => {
    try {
      setIsRecording(true);
      setRecordingProgress(0);

      await videoService.startRecording();

      // Start animation with frame capture
      simulateRecordingAnimation();
    } catch (error) {
      Alert.alert("Recording Error", "Failed to start recording");
      setIsRecording(false);
    }
  };

  const simulateRecordingAnimation = async () => {
    const totalFrames = route.waypoints.length * 2; // 2 frames per waypoint

    for (let i = 0; i < totalFrames; i++) {
      if (!isRecording) break;

      // Capture frame
      if (mapRef.current) {
        await videoService.captureFrame(mapRef.current, i);
      }

      // Update progress
      setRecordingProgress((i + 1) / totalFrames);

      // Wait for next frame
      await new Promise((resolve) => setTimeout(resolve, 33)); // ~30fps
    }

    await finishRecording();
  };

  const finishRecording = async () => {
    try {
      setProcessingVideo(true);

      const frames = await videoService.stopRecording();
      console.log(`Recorded ${frames.length} frames`);

      // Create video from frames
      const videoUri = await videoService.createVideoFromFrames(frames);

      // Clean up temporary frame files
      await videoService.cleanupFrames(frames);

      setIsRecording(false);
      setProcessingVideo(false);
      setRecordingProgress(0);

      Alert.alert("Success", "Video created successfully!");

      if (onVideoCreated) {
        onVideoCreated(videoUri);
      }
    } catch (error) {
      console.error("Video creation failed:", error);
      Alert.alert("Error", "Failed to create video");
      setIsRecording(false);
      setProcessingVideo(false);
    }
  };

  const handleFrameCapture = async (frameData: any) => {
    // Disable frame capture for now as it requires further setup
    console.log("Frame capture requested:", frameData);
    return;

    // Original code - disabled
    // if (isRecording && mapRef.current) {
    //   await videoService.captureFrame(mapRef.current, frameData.index);
    // }
  };

  return {
    isRecording,
    recordingProgress,
    processingVideo,
    mapRef,
    videoService,
    startRecording,
    setIsRecording,
    handleFrameCapture,
  };
};
