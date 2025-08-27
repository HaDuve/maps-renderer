import React, { useRef, useState } from "react";
import { View, Text, Alert } from "react-native";
import { Button, ProgressBar, Card } from "react-native-paper";
import {
  AnimatedRouteMapWithCapture,
  AnimatedRouteMapWithCaptureRef,
} from "../AnimatedRouteMapWithCapture";
import { VideoRecordingService } from "@services/VideoRecordingService";
import { TProps } from "./types";
import { styles } from "./styles";

export const RecordableRouteMap = (props: TProps) => {
  const { route, onVideoCreated } = props;

  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [processingVideo, setProcessingVideo] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState(0);

  const mapRef = useRef<AnimatedRouteMapWithCaptureRef>(null);
  const videoService = useRef(
    new VideoRecordingService({
      fps: 30,
      duration: 10,
      quality: 0.9,
    })
  ).current;

  // Handle frame capture callback
  const handleFrameCapture = (frameData: any) => {
    setCapturedFrames((prev) => prev + 1);
    setRecordingProgress(
      frameData.index / Math.max(route.waypoints.length - 1, 1)
    );
  };

  // Toggle recording state
  const startRecording = async () => {
    if (isRecording) return;

    try {
      setIsRecording(true);
      setRecordingProgress(0);
      setCapturedFrames(0);

      // Start the map recording
      if (mapRef.current && mapRef.current.startFrameCapture) {
        const success = await mapRef.current.startFrameCapture();
        if (!success) {
          setIsRecording(false);
          Alert.alert("Error", "Failed to start frame capture");
        }
      }
    } catch (error) {
      console.error("Error starting frame capture:", error);
      setIsRecording(false);
      Alert.alert("Recording Error", "Failed to start recording");
    }
  };

  // Stop recording and process video
  const stopRecording = async () => {
    if (!isRecording) return;

    try {
      setProcessingVideo(true);

      // Stop frame capture
      if (mapRef.current && mapRef.current.stopFrameCapture) {
        const frames = await mapRef.current.stopFrameCapture();
        console.log(`Captured ${frames.length} frames`);

        // Get frame directory
        const frameDirectory = await mapRef.current.getFrameCaptureDirectory();

        if (frameDirectory && frames.length > 0) {
          // Create a video from the frames
          const videoUri = await videoService.createVideoFromFrames(frames);

          // Cleanup frames
          // This is simplified - in a real implementation you'd want to properly convert frames to video
          await videoService.cleanupFrames(frames);

          // Call the callback with the video URI
          if (onVideoCreated) {
            onVideoCreated(videoUri);
          }

          Alert.alert("Success", "Video created successfully!");
        }
      }
    } catch (error) {
      console.error("Video creation failed:", error);
      Alert.alert("Error", "Failed to create video");
    } finally {
      setIsRecording(false);
      setProcessingVideo(false);
      setRecordingProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <AnimatedRouteMapWithCapture
          ref={mapRef}
          route={route}
          isRecording={isRecording}
          onFrameCapture={handleFrameCapture}
          frameCaptureOptions={{
            fps: 30,
            quality: 1.0,
            format: "png",
          }}
        />
      </View>

      <Card style={styles.recordingCard}>
        <Card.Content>
          {isRecording && (
            <View style={styles.recordingIndicator}>
              <View style={styles.recordingDot} />
              <Text style={styles.recordingText}>Recording...</Text>
            </View>
          )}

          {recordingProgress > 0 && (
            <View style={styles.progressContainer}>
              <Text>Recording Progress</Text>
              <ProgressBar
                progress={recordingProgress}
                color="#FF6B35"
                style={styles.progressBar}
              />
              <Text>{Math.round(recordingProgress * 100)}%</Text>
            </View>
          )}

          {processingVideo && (
            <View style={styles.processingContainer}>
              <Text>Processing video...</Text>
              <ProgressBar
                indeterminate
                color="#FF6B35"
                style={styles.progressBar}
              />
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={startRecording}
              disabled={
                isRecording || processingVideo || route.waypoints.length < 2
              }
              style={styles.recordButton}
              icon="video"
            >
              {isRecording ? "Recording..." : "Start Recording"}
            </Button>

            {isRecording && (
              <Button
                mode="outlined"
                onPress={() => setIsRecording(false)}
                style={styles.stopButton}
                icon="stop"
              >
                Stop
              </Button>
            )}
          </View>

          <Text style={styles.infoText}>
            {capturedFrames > 0
              ? `Captured ${capturedFrames} frames`
              : route.waypoints.length < 2
              ? "Add at least 2 waypoints to record"
              : `Ready to record ${route.waypoints.length} waypoints`}
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
};
