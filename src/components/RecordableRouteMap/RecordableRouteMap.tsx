import React from "react";
import { View, Text } from "react-native";
import { Button, ProgressBar, Card } from "react-native-paper";
import { AnimatedRouteMap } from "../AnimatedRouteMap";
import { TProps } from "./types";
import { useController } from "./controller";
import { styles } from "./styles";

export const RecordableRouteMap = (props: TProps) => {
  const { route } = props;

  const {
    isRecording,
    recordingProgress,
    processingVideo,
    mapRef,
    startRecording,
    setIsRecording,
    handleFrameCapture,
  } = useController(props);

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
