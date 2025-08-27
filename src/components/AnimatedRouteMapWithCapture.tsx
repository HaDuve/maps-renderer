import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { View, Text, StyleSheet, Alert } from "react-native";
import { Button, Card } from "react-native-paper";
import { AnimatedRouteMap } from "./AnimatedRouteMap";
import { Route } from "../types/Route";
import { FrameCaptureOptions } from "../services/FrameCaptureService";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";

export interface AnimatedRouteMapWithCaptureProps {
  route: Route;
  isRecording?: boolean;
  onFrameCapture?: (frameData: any) => void;
  frameCaptureOptions?: Partial<FrameCaptureOptions>;
}

export interface AnimatedRouteMapWithCaptureRef {
  startFrameCapture: () => Promise<boolean>;
  stopFrameCapture: () => Promise<any[]>;
  getFrameCaptureDirectory: () => Promise<string | null>;
}

export const AnimatedRouteMapWithCapture = forwardRef<
  AnimatedRouteMapWithCaptureRef,
  AnimatedRouteMapWithCaptureProps
>(
  (
    {
      route,
      isRecording: externalIsRecording,
      onFrameCapture: externalFrameCaptureHandler,
      frameCaptureOptions: externalOptions,
    },
    ref
  ) => {
    const [isRecording, setIsRecording] = useState(
      externalIsRecording || false
    );
    const [capturedFrames, setCapturedFrames] = useState<number>(0);
    const mapRef = useRef<any>(null);

    // Options for frame capture
    const frameCaptureOptions: Partial<FrameCaptureOptions> =
      externalOptions || {
        fps: 30,
        quality: 1.0,
        format: "png" as "png", // explicitly type as "png" | "jpg" union
      };

    // Handle frame capture callback
    const handleFrameCapture = (frameData: any) => {
      setCapturedFrames((prev) => prev + 1);
      console.log(`Captured frame at index ${frameData.index}`);

      // Call external handler if provided
      if (externalFrameCaptureHandler) {
        externalFrameCaptureHandler(frameData);
      }
    };

    // Toggle recording state
    const toggleRecording = async () => {
      if (isRecording) {
        // Stop recording
        setIsRecording(false);

        // Access the AnimatedRouteMap component and stop frame capture
        if (mapRef.current && mapRef.current.stopFrameCapture) {
          try {
            const frames = await mapRef.current.stopFrameCapture();
            Alert.alert(
              "Recording Complete",
              `Captured ${frames.length} frames`
            );
          } catch (error) {
            console.error("Error stopping frame capture:", error);
            Alert.alert("Error", "Failed to stop frame capture");
          }
        }
      } else {
        // Request media library permissions before starting
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Required",
            "Media library permission is needed to save frames"
          );
          return;
        }

        // Start recording
        setCapturedFrames(0);

        // Access the AnimatedRouteMap component and start frame capture
        if (mapRef.current && mapRef.current.startFrameCapture) {
          try {
            const success = await mapRef.current.startFrameCapture();
            if (success) {
              setIsRecording(true);
            } else {
              Alert.alert("Error", "Failed to start frame capture");
            }
          } catch (error) {
            console.error("Error starting frame capture:", error);
            Alert.alert("Error", "Failed to start frame capture");
          }
        }
      }
    };

    // Save frames to the media library
    const saveFrames = async () => {
      if (mapRef.current && mapRef.current.getFrameCaptureDirectory) {
        try {
          const directory = await mapRef.current.getFrameCaptureDirectory();
          if (directory) {
            Alert.alert(
              "Frames Directory",
              `Frames are stored at: ${directory}`,
              [
                {
                  text: "OK",
                  style: "default",
                },
              ]
            );

            // Here you could implement saving to media library or processing the frames
            // For demonstration purposes, just showing the directory path
          } else {
            Alert.alert("Error", "No frames directory available");
          }
        } catch (error) {
          console.error("Error getting frames directory:", error);
          Alert.alert("Error", "Failed to get frames directory");
        }
      }
    };

    // Expose methods to parent component via ref
    useImperativeHandle(ref, () => ({
      startFrameCapture: async () => {
        if (mapRef.current && mapRef.current.startFrameCapture) {
          return await mapRef.current.startFrameCapture();
        }
        return false;
      },
      stopFrameCapture: async () => {
        if (mapRef.current && mapRef.current.stopFrameCapture) {
          return await mapRef.current.stopFrameCapture();
        }
        return [];
      },
      getFrameCaptureDirectory: async () => {
        if (mapRef.current && mapRef.current.getFrameCaptureDirectory) {
          return await mapRef.current.getFrameCaptureDirectory();
        }
        return null;
      },
    }));

    return (
      <View style={styles.container}>
        <AnimatedRouteMap
          ref={mapRef}
          route={route}
          isRecording={isRecording}
          onFrameCapture={handleFrameCapture}
          frameCaptureOptions={frameCaptureOptions}
        />

        <Card style={styles.controlsCard}>
          <Card.Content>
            <View style={styles.rowContainer}>
              <Button
                mode="contained"
                onPress={toggleRecording}
                style={[
                  styles.button,
                  { backgroundColor: isRecording ? "#F44336" : "#4CAF50" },
                ]}
                icon={isRecording ? "stop" : "record"}
              >
                {isRecording ? "Stop Recording" : "Start Recording"}
              </Button>

              <Button
                mode="outlined"
                onPress={saveFrames}
                disabled={capturedFrames === 0}
                style={styles.button}
                icon="content-save"
              >
                Save Frames
              </Button>
            </View>

            <Text style={styles.infoText}>
              {capturedFrames > 0
                ? `Captured ${capturedFrames} frames`
                : "No frames captured yet"}
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  controlsCard: {
    margin: 16,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  infoText: {
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
});

AnimatedRouteMapWithCapture.displayName = "AnimatedRouteMapWithCapture";
