import { StyleSheet } from "react-native";
import { Route, Waypoint } from "../types/Route";

export type TAppProps = {
  // No props needed for the root App component
};

export type TController = {
  currentRoute: Route | null;
  recordedVideoUri: string | null;
  index: number;
  setIndex: (index: number) => void;
  handleSaveRoute: (routeData: Partial<Route>) => void;
  handleAddWaypoint: (waypointData: Omit<Waypoint, "id">) => void;
  handleDeleteWaypoint: (waypointId: string) => void;
  handleUpdateWaypoint: (
    waypointId: string,
    updates: Partial<Waypoint>
  ) => void;
  handleVideoCreated: (videoUri: string) => void;
  routes: Array<{
    key: string;
    title: string;
    focusedIcon: string;
    unfocusedIcon: string;
  }>;
  styles: {
    scene: {
      flex: number;
      backgroundColor: string;
    };
    emptyState: {
      flex: number;
      justifyContent: "center";
      alignItems: "center";
      padding: number;
    };
  };
};
