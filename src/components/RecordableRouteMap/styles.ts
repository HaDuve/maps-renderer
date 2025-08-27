import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
    height: 300,
    marginBottom: 10,
  },
  recordingCard: {
    margin: 16,
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF0000",
    marginRight: 8,
  },
  recordingText: {
    color: "#FF0000",
    fontWeight: "bold",
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    marginVertical: 8,
    height: 8,
    borderRadius: 4,
  },
  processingContainer: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  recordButton: {
    flex: 1,
    marginRight: 8,
  },
  stopButton: {
    flex: 1,
    marginLeft: 8,
  },
  infoText: {
    textAlign: "center",
    color: "#666",
    fontSize: 12,
  },
});
