import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { Button, Card, ProgressBar } from 'react-native-paper';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Slider from '@react-native-community/slider';
import Animated from 'react-native-reanimated';
import { Route } from '../types/Route';

interface AnimatedRouteMapProps {
  route: Route;
  onFrameCapture?: (frameData: any) => void;
  isRecording?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const AnimatedRouteMap: React.FC<AnimatedRouteMapProps> = ({
  route,
  onFrameCapture,
  isRecording = false
}) => {
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

    const coordinates = route.waypoints.map(wp => wp.coordinate);
    const minLat = Math.min(...coordinates.map(c => c.latitude));
    const maxLat = Math.max(...coordinates.map(c => c.latitude));
    const minLng = Math.min(...coordinates.map(c => c.longitude));
    const maxLng = Math.max(...coordinates.map(c => c.longitude));

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
      setCurrentIndex(prevIndex => {
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

  // Progress indicator style
  const progressStyle = {
    width: `${progress * 100}%`,
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (route.waypoints.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text>No waypoints in this route</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={mapRegion}
        showsUserLocation={false}
        onLayout={fitToRoute}
      >
        {/* Polyline showing full route */}
        <Polyline
          coordinates={route.waypoints.map(wp => wp.coordinate)}
          strokeColor="#FF6B35"
          strokeWidth={4}
          strokeColors={['#7F0000', '#B24112', '#E5845C', '#FF6B35']}
        />

        {/* All waypoint markers */}
        {route.waypoints.map((waypoint, index) => (
          <Marker
            key={waypoint.id}
            coordinate={waypoint.coordinate}
            title={waypoint.name || `Waypoint ${index + 1}`}
            pinColor={index === currentIndex ? 'red' : 'blue'}
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
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={startAnimation}
              style={[styles.controlButton, { backgroundColor: isPlaying ? '#FF4444' : '#FF6B35' }]}
              icon={isPlaying ? 'pause' : 'play'}
            >
              {isPlaying ? 'Pause' : 'Play'}
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
              onPress={() => setAnimationSpeed(speed => speed === 1 ? 2 : speed === 2 ? 0.5 : 1)}
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
            <Text style={styles.infoText}>
              {route.metadata.name}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  currentMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B35',
    borderWidth: 3,
    borderColor: 'white',
  },
  controlsCard: {
    margin: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    marginTop: 8,
    height: 8,
    borderRadius: 4,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  controlButton: {
    marginHorizontal: 4,
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
});

export default AnimatedRouteMap;
