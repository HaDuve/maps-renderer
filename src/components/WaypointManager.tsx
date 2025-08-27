import React, { useState, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { List, FAB, IconButton, Card, Modal, Portal, Button, TextInput } from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Waypoint, Coordinate } from '../types/Route';

interface WaypointManagerProps {
  waypoints: Waypoint[];
  onAddWaypoint: (waypoint: Omit<Waypoint, 'id'>) => void;
  onDeleteWaypoint: (id: string) => void;
  onUpdateWaypoint: (id: string, updates: Partial<Waypoint>) => void;
}

const WaypointManager: React.FC<WaypointManagerProps> = ({
  waypoints,
  onAddWaypoint,
  onDeleteWaypoint,
  onUpdateWaypoint
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCoordinate, setSelectedCoordinate] = useState<Coordinate | null>(null);
  const [waypointName, setWaypointName] = useState('');
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
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
      console.error('Error getting location:', error);
    }
  };

  const handleMapPress = (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    setSelectedCoordinate(coordinate);
  };

  const handleAddWaypoint = () => {
    if (!selectedCoordinate) {
      Alert.alert('Error', 'Please select a location on the map');
      return;
    }

    const newWaypoint: Omit<Waypoint, 'id'> = {
      coordinate: selectedCoordinate,
      name: waypointName.trim() || undefined,
      timestamp: Date.now(),
    };

    onAddWaypoint(newWaypoint);
    setShowAddModal(false);
    setWaypointName('');
    setSelectedCoordinate(null);
  };

  const handleDeleteWaypoint = (id: string) => {
    Alert.alert(
      'Delete Waypoint',
      'Are you sure you want to delete this waypoint?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDeleteWaypoint(id) }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {waypoints.map((waypoint, index) => (
        <Card key={waypoint.id} style={styles.waypointCard}>
          <List.Item
            title={waypoint.name || `Waypoint ${index + 1}`}
            description={`${waypoint.coordinate.latitude.toFixed(6)}, ${waypoint.coordinate.longitude.toFixed(6)}`}
            left={props => <List.Icon {...props} icon="map-marker" />}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  waypointCard: {
    marginBottom: 8,
    marginHorizontal: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  modal: {
    margin: 20,
  },
  input: {
    marginBottom: 16,
  },
  map: {
    height: 300,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default WaypointManager;
