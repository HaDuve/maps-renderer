import { useState } from "react";
import { Alert } from "react-native";
import * as Location from "expo-location";
import { Waypoint, Coordinate } from "@types/Route";
import { TProps, TController } from "./types";

export const useController = ({
  waypoints,
  onAddWaypoint,
  onDeleteWaypoint,
}: TProps): TController => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCoordinate, setSelectedCoordinate] =
    useState<Coordinate | null>(null);
  const [waypointName, setWaypointName] = useState("");
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);
      setSelectedCoordinate({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error("Error getting location:", error);
    }
  };

  const handleMapPress = (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    setSelectedCoordinate(coordinate);
  };

  const handleAddWaypoint = () => {
    if (!selectedCoordinate) {
      Alert.alert("Error", "Please select a location on the map");
      return;
    }

    const newWaypoint: Omit<Waypoint, "id"> = {
      coordinate: selectedCoordinate,
      name: waypointName.trim() || undefined,
      timestamp: Date.now(),
    };

    onAddWaypoint(newWaypoint);
    setShowAddModal(false);
    setWaypointName("");
    setSelectedCoordinate(null);
  };

  const handleDeleteWaypoint = (id: string) => {
    Alert.alert(
      "Delete Waypoint",
      "Are you sure you want to delete this waypoint?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDeleteWaypoint(id),
        },
      ]
    );
  };

  return {
    showAddModal,
    selectedCoordinate,
    waypointName,
    region,
    handleMapPress,
    handleAddWaypoint,
    handleDeleteWaypoint,
    setShowAddModal,
    setWaypointName,
    getCurrentLocation,
  };
};
