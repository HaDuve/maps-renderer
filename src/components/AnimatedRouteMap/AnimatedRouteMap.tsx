import React, { forwardRef, useImperativeHandle } from "react";
import { View, Text, Dimensions } from "react-native";
import { Button, Card, ProgressBar, IconButton } from "react-native-paper";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import Slider from "@react-native-community/slider";
import { TProps } from "./types";
import { useController } from "./controller";
import { styles } from "./styles";

const { width: screenWidth } = Dimensions.get("window");

export const AnimatedRouteMap = forwardRef((props: TProps, ref) => {
  const { route } = props;

  const {
    isPlaying,
    currentIndex,
    animationSpeed,
    setAnimationSpeed,
    mapRef,
    progress,
    mapRegion,
    getRouteRegion,
    startAnimation,
    fitToRoute,
    handleSliderChange,
    // Frame capture functionality
    frameCaptureStatus,
    startFrameCapture,
    stopFrameCapture,
    getFrameCaptureDirectory,
  } = useController(props);

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    startFrameCapture,
    stopFrameCapture,
    getFrameCaptureDirectory,
  }));

  if (route.waypoints.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text>No waypoints in this route</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={mapRegion}
          showsUserLocation={false}
          onLayout={fitToRoute}
        >
          {/* Polyline showing full route */}
          <Polyline
            coordinates={route.waypoints.map((wp) => wp.coordinate)}
            strokeColor="#FF6B35"
            strokeWidth={4}
            strokeColors={["#7F0000", "#B24112", "#E5845C", "#FF6B35"]}
          />

          {/* All waypoint markers */}
          {route.waypoints.map((waypoint, index) => (
            <Marker
              key={waypoint.id}
              coordinate={waypoint.coordinate}
              title={waypoint.name || `Waypoint ${index + 1}`}
              pinColor={index === currentIndex ? "red" : "blue"}
            />
          ))}

          {/* Current position marker */}
          {route.waypoints[currentIndex] && (
            <Marker
              coordinate={route.waypoints[currentIndex].coordinate}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={[styles.currentMarker, { opacity: 1 }]} />
            </Marker>
          )}
        </MapView>
      </View>

      {/* Controls */}
      <Card style={styles.controlsCard}>
        <Card.Content>
          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <Text>Progress</Text>
            <ProgressBar
              progress={currentIndex / Math.max(route.waypoints.length - 1, 1)}
              color="#FF6B35"
              style={styles.progressBar}
            />
          </View>

          {/* Timeline slider */}
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={route.waypoints.length - 1}
            step={1}
            value={currentIndex}
            onValueChange={handleSliderChange}
            minimumTrackTintColor="#FF6B35"
            maximumTrackTintColor="#CCCCCC"
          />

          {/* Control buttons */}
          {/* Frame capture progress */}
          {frameCaptureStatus.isCapturing && (
            <View style={styles.progressContainer}>
              <Text>Capturing frames: {frameCaptureStatus.framesCount}</Text>
              <ProgressBar
                progress={frameCaptureStatus.progress}
                color="#4CAF50"
                style={styles.progressBar}
              />
              <Text>{Math.round(frameCaptureStatus.progress * 100)}%</Text>
              {frameCaptureStatus.error && (
                <Text style={styles.errorText}>{frameCaptureStatus.error}</Text>
              )}
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={startAnimation}
              style={[
                styles.controlButton,
                { backgroundColor: isPlaying ? "#FF4444" : "#FF6B35" },
              ]}
              icon={isPlaying ? "pause" : "play"}
            >
              {isPlaying ? "Pause" : "Play"}
            </Button>

            <Button
              mode="outlined"
              onPress={fitToRoute}
              style={styles.controlButton}
              icon="fit-to-page"
            >
              Fit Route
            </Button>

            <Button
              mode="outlined"
              onPress={() => {
                const newSpeed =
                  animationSpeed === 1 ? 2 : animationSpeed === 2 ? 0.5 : 1;
                setAnimationSpeed(newSpeed);
              }}
              style={styles.controlButton}
            >
              Speed: {animationSpeed}x
            </Button>
          </View>

          {/* Route info */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Waypoint {currentIndex + 1} of {route.waypoints.length}
            </Text>
            <Text style={styles.infoText}>{route.metadata.name}</Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
});

// Add a display name to the forwarded ref component
AnimatedRouteMap.displayName = "AnimatedRouteMap";
