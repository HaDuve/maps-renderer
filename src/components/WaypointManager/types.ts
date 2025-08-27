import { Waypoint, Coordinate } from "@types/Route";
import { Region } from "react-native-maps";

export type TProps = {
  waypoints: Waypoint[];
  onAddWaypoint: (waypoint: Omit<Waypoint, "id">) => void;
  onDeleteWaypoint: (id: string) => void;
  onUpdateWaypoint: (id: string, updates: Partial<Waypoint>) => void;
};

export type TController = {
  showAddModal: boolean;
  selectedCoordinate: Coordinate | null;
  waypointName: string;
  region: Region;
  handleMapPress: (event: any) => void;
  handleAddWaypoint: () => void;
  handleDeleteWaypoint: (id: string) => void;
  setShowAddModal: (show: boolean) => void;
  setWaypointName: (name: string) => void;
  getCurrentLocation: () => Promise<void>;
};
