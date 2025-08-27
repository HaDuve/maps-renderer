import React from "react";
import { View, Text } from "react-native";
import { Button, Card, ProgressBar, Divider } from "react-native-paper";
import { TProps } from "./types";
import { useController } from "./controller";
import { styles } from "./styles";

export const VideoExportComponent = (props: TProps) => {
  const { routeName } = props;

  const {
    isExporting,
    exportProgress,
    isSharing,
    handleSaveToGallery,
    handleShareVideo,
  } = useController(props);

  return (
    <Card style={styles.container}>
      <Card.Content>
        <Text style={styles.title}>Export Route Video</Text>
        <Text style={styles.subtitle}>{routeName}</Text>

        <Divider style={styles.divider} />

        {isExporting && (
          <View style={styles.progressContainer}>
            <Text>Saving to gallery...</Text>
            <ProgressBar
              progress={exportProgress}
              color="#FF6B35"
              style={styles.progressBar}
            />
            <Text>{Math.round(exportProgress * 100)}%</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSaveToGallery}
            disabled={isExporting || isSharing}
            style={styles.button}
            icon="download"
          >
            {isExporting ? "Saving..." : "Save to Gallery"}
          </Button>

          <Button
            mode="outlined"
            onPress={handleShareVideo}
            disabled={isExporting || isSharing}
            style={styles.button}
            icon="share"
          >
            {isSharing ? "Sharing..." : "Share Video"}
          </Button>
        </View>

        <Text style={styles.infoText}>
          Video will be saved to your device's photo library in the "Travel
          Route Videos" album.
        </Text>
      </Card.Content>
    </Card>
  );
};
