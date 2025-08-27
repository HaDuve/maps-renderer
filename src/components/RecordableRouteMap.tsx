import React, { useRef, useState } from "react";
import { View, StyleSheet, Alert, Text } from "react-native";
import { Button, ProgressBar, Card } from "react-native-paper";
import { AnimatedRouteMap } from "@components/AnimatedRouteMap/AnimatedRouteMap";
import { VideoRecordingService } from "@services/VideoRecordingService";
import { Route } from "../types/Route";

interface RecordableRouteMapProps {
  route: Route;
  onVideoCreated?: (videoUri: string) => void;
}

const RecordableRouteMap: React.FC<RecordableRouteMapProps> = ({
  route,
  onVideoCreated,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [processingVideo, setProcessingVideo] = useState(false);

  const mapRef = useRef<View>(null);
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

  return (
    <View style={styles.container}>
      <View ref={mapRef} style={styles.mapContainer}>
        <AnimatedRouteMap
          route={route}
          onFrameCapture={handleFrameCapture}
          isRecording={isRecording}
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
            {route.waypoints.length < 2
              ? "Add at least 2 waypoints to record"
              : `Ready to record ${route.waypoints.length} waypoints`}
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    height: 300,
    marginBottom: 10,
  },
  recordingCard: {
    margin: 16,
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF0000",
    marginRight: 8,
  },
  recordingText: {
    color: "#FF0000",
    fontWeight: "bold",
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    marginVertical: 8,
    height: 8,
    borderRadius: 4,
  },
  processingContainer: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  recordButton: {
    flex: 1,
    marginRight: 8,
  },
  stopButton: {
    flex: 1,
    marginLeft: 8,
  },
  infoText: {
    textAlign: "center",
    color: "#666",
    fontSize: 12,
  },
});

export default RecordableRouteMap;
