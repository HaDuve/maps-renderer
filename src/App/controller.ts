import { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import { Route, Waypoint } from "../types/Route";
import { TAppProps, TController } from "./types";

export const useController = (props: TAppProps): TController => {
  const [currentRoute, setCurrentRoute] = useState<Route | null>(null);
  const [recordedVideoUri, setRecordedVideoUri] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Create a sample route with 3 pre-generated waypoints for testing
  useEffect(() => {
    if (!currentRoute) {
      const sampleRoute = {
        id: generateId(),
        waypoints: [
          {
            id: generateId(),
            coordinate: { latitude: 37.7749, longitude: -122.4194 },
            name: "San Francisco",
            timestamp: Date.now(),
          },
          {
            id: generateId(),
            coordinate: { latitude: 37.6688, longitude: -122.0808 },
            name: "San Mateo",
            timestamp: Date.now() + 1000,
          },
          {
            id: generateId(),
            coordinate: { latitude: 37.4419, longitude: -122.1430 },
            name: "Palo Alto",
            timestamp: Date.now() + 2000,
          },
        ],
        metadata: {
          name: "Bay Area Demo Route",
          description: "Sample 3-waypoint route through the Bay Area. Edit waypoints as needed.",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      };
      setCurrentRoute(sampleRoute as Route);
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

  const styles = StyleSheet.create({
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

  return {
    currentRoute,
    recordedVideoUri,
    index,
    setIndex,
    handleSaveRoute,
    handleAddWaypoint,
    handleDeleteWaypoint,
    handleUpdateWaypoint,
    handleVideoCreated,
    routes,
    styles,
  };
};
