import React from "react";
import { View, ScrollView, Text } from "react-native";
import {
  Provider as PaperProvider,
  Appbar,
  BottomNavigation,
  DefaultTheme,
} from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { enableLatestRenderer } from "react-native-maps";
import { Platform } from "react-native";
import { TAppProps } from "./types";
import { useController } from "./controller";
import { styles as appStyles } from "./styles";

// Import components
import { RouteInputForm } from "../components/RouteInputForm/RouteInputForm";
import { WaypointManager } from "../components/WaypointManager/WaypointManager";
import { RecordableRouteMap } from "../components/RecordableRouteMap/RecordableRouteMap";
import { VideoExportComponent } from "../components/VideoExportComponent";

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

export const App = (props: TAppProps) => {
  const {
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
  } = useController(props);

  // Create render scene map with the components
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
        <SafeAreaView style={appStyles.container}>
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
};
