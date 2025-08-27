import React from "react";
import { View } from "react-native";
import {
  List,
  FAB,
  IconButton,
  Card,
  Modal,
  Portal,
  Button,
  TextInput,
} from "react-native-paper";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { TProps } from "./types";
import { useController } from "./controller";
import { styles } from "./styles";

export const WaypointManager = (props: TProps) => {
  const { waypoints } = props;

  const {
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
  } = useController(props);

  return (
    <View style={styles.container}>
      {waypoints.map((waypoint, index) => (
        <Card key={waypoint.id} style={styles.waypointCard}>
          <List.Item
            title={waypoint.name || `Waypoint ${index + 1}`}
            description={`${waypoint.coordinate.latitude.toFixed(
              6
            )}, ${waypoint.coordinate.longitude.toFixed(6)}`}
            left={(props) => <List.Icon {...props} icon="map-marker" />}
            right={() => (
              <IconButton
                icon="delete"
                onPress={() => handleDeleteWaypoint(waypoint.id)}
              />
            )}
          />
        </Card>
      ))}

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => {
          getCurrentLocation();
          setShowAddModal(true);
        }}
      />

      <Portal>
        <Modal
          visible={showAddModal}
          onDismiss={() => setShowAddModal(false)}
          contentContainerStyle={styles.modal}
        >
          <Card>
            <Card.Title title="Add Waypoint" />
            <Card.Content>
              <TextInput
                label="Waypoint Name (Optional)"
                value={waypointName}
                onChangeText={setWaypointName}
                mode="outlined"
                style={styles.input}
              />

              <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                region={region}
                onPress={handleMapPress}
              >
                {selectedCoordinate && (
                  <Marker coordinate={selectedCoordinate} />
                )}
              </MapView>

              <View style={styles.buttonRow}>
                <Button onPress={() => setShowAddModal(false)}>Cancel</Button>
                <Button
                  mode="contained"
                  onPress={handleAddWaypoint}
                  disabled={!selectedCoordinate}
                >
                  Add Waypoint
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
};
