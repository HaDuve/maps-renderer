import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, ScrollView, Text, Platform } from "react-native";
import {
  Provider as PaperProvider,
  Appbar,
  BottomNavigation,
  DefaultTheme,
} from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { enableLatestRenderer } from "react-native-maps";

// Import components
import RouteInputForm from "./src/components/RouteInputForm";
import WaypointManager from "./src/components/WaypointManager";
import RecordableRouteMap from "./src/components/RecordableRouteMap";
import VideoExportComponent from "./src/components/VideoExportComponent";

// Import types
import { Route, Waypoint } from "./src/types/Route";

// Create a custom theme
const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#FF6B35",
    accent: "#4CA5FF",
  },
};

// Enable latest renderer for Google Maps
if (Platform.OS === "android") {
  enableLatestRenderer();
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [recordedVideoUri, setRecordedVideoUri] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Create a sample route for testing
  useEffect(() => {
    if (!currentRoute) {
      const sampleRoute = {
        id: generateId(),
        waypoints: [
          {
            id: generateId(),
            coordinate: { latitude: 37.7749, longitude: -122.4194 }, // San Francisco
            name: "San Francisco",
            timestamp: Date.now(),
          },
          {
            id: generateId(),
            coordinate: { latitude: 37.8716, longitude: -122.2727 }, // Berkeley
            name: "Berkeley",
            timestamp: Date.now() + 1000,
          },
          {
            id: generateId(),
            coordinate: { latitude: 37.7749, longitude: -122.2521 }, // Oakland
            name: "Oakland",
            timestamp: Date.now() + 2000,
          },
        ],
        metadata: {
          name: "Bay Area Tour",
          description: "Sample route around the Bay Area",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      };
      setCurrentRoute(sampleRoute as any);
    }
  }, []);

  const handleSaveRoute = (routeData: Partial<Route>) => {
    const newRoute: Route = {
      id: generateId(),
      waypoints: [],
      totalDistance: 0,
      ...routeData,
      metadata: {
        ...(routeData.metadata || {}),
      },
    } as Route;

    setCurrentRoute(newRoute);
    // Switch to waypoints tab
    setIndex(0);
  };

  const handleAddWaypoint = (waypointData: Omit<Waypoint, "id">) => {
    if (!currentRoute) return;

    const newWaypoint: Waypoint = {
      id: generateId(),
      ...waypointData,
    };

    setCurrentRoute({
      ...currentRoute,
      waypoints: [...currentRoute.waypoints, newWaypoint],
    });
  };

  const handleDeleteWaypoint = (waypointId: string) => {
    if (!currentRoute) return;

    setCurrentRoute({
      ...currentRoute,
      waypoints: currentRoute.waypoints.filter((wp) => wp.id !== waypointId),
    });
  };

  const handleUpdateWaypoint = (
    waypointId: string,
    updates: Partial<Waypoint>
  ) => {
    if (!currentRoute) return;

    setCurrentRoute({
      ...currentRoute,
      waypoints: currentRoute.waypoints.map((wp) =>
        wp.id === waypointId ? { ...wp, ...updates } : wp
      ),
    });
  };

  const handleVideoCreated = (videoUri: string) => {
    setRecordedVideoUri(videoUri);
    setIndex(2); // Switch to export tab
  };

  const routes = [
    {
      key: "create",
      title: "Create Route",
      focusedIcon: "map-marker-path",
      unfocusedIcon: "map-marker-path",
    },
    {
      key: "animate",
      title: "Animate",
      focusedIcon: "play",
      unfocusedIcon: "play-outline",
    },
    {
      key: "export",
      title: "Export",
      focusedIcon: "share",
      unfocusedIcon: "share-outline",
    },
  ];

  const renderScene = BottomNavigation.SceneMap({
    create: () => (
      <ScrollView style={styles.scene}>
        {!currentRoute ? (
          <RouteInputForm onSaveRoute={handleSaveRoute} />
        ) : (
          <WaypointManager
            waypoints={currentRoute.waypoints}
            onAddWaypoint={handleAddWaypoint}
            onDeleteWaypoint={handleDeleteWaypoint}
            onUpdateWaypoint={handleUpdateWaypoint}
          />
        )}
      </ScrollView>
    ),
    animate: () => (
      <View style={styles.scene}>
        {currentRoute && currentRoute.waypoints.length >= 2 ? (
          <RecordableRouteMap
            route={currentRoute}
            onVideoCreated={handleVideoCreated}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text>
              Create a route with at least 2 waypoints to start animating
            </Text>
          </View>
        )}
      </View>
    ),
    export: () => (
      <ScrollView style={styles.scene}>
        {recordedVideoUri && currentRoute ? (
          <VideoExportComponent
            videoUri={recordedVideoUri}
            routeName={currentRoute.metadata.name}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text>Record a route animation first</Text>
          </View>
        )}
      </ScrollView>
    ),
  });

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <SafeAreaView style={styles.container}>
          <Appbar.Header>
            <Appbar.Content title="Travel Route Renderer" />
          </Appbar.Header>

          <BottomNavigation
            navigationState={{ index, routes }}
            onIndexChange={setIndex}
            renderScene={renderScene}
          />
          <StatusBar style="auto" />
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scene: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
