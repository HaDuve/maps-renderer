import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    minHeight: 400, // Increased minimum height
    marginBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    minHeight: 400,
  },
  currentMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF6B35",
    borderWidth: 3,
    borderColor: "white",
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
    width: "100%",
    height: 40,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  controlButton: {
    marginHorizontal: 4,
  },
  infoContainer: {
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
  },
  errorText: {
    fontSize: 14,
    color: "#F44336",
    marginTop: 4,
  },
  captureButton: {
    marginHorizontal: 4,
    backgroundColor: "#4CAF50",
  },
  captureStopButton: {
    marginHorizontal: 4,
    backgroundColor: "#F44336",
  },
});
