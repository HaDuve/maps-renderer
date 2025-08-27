import React, { useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Button, Card, ProgressBar, Divider } from 'react-native-paper';
import { VideoExportService } from '../services/VideoExportService';

interface VideoExportComponentProps {
  videoUri: string;
  routeName: string;
}

const VideoExportComponent: React.FC<VideoExportComponentProps> = ({
  videoUri,
  routeName
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [isSharing, setIsSharing] = useState(false);

  const exportService = new VideoExportService();

  const handleSaveToGallery = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 0.1, 0.9));
      }, 200);

      const albumName = 'Travel Route Videos';
      const asset = await exportService.saveVideoToGallery(videoUri, albumName);

      clearInterval(progressInterval);
      setExportProgress(1);

      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);

      console.log('Video saved:', asset);

    } catch (error) {
      exportService.handleError(error as Error, 'save video');
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleShareVideo = async () => {
    try {
      setIsSharing(true);
      await exportService.shareVideo(videoUri);
    } catch (error) {
      exportService.handleError(error as Error, 'share video');
    } finally {
      setIsSharing(false);
    }
  };

  const getStorageInfo = async () => {
    const info = await exportService.getStorageInfo();
    if (info) {
      console.log('Storage info:', info);
    }
  };

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
            {isExporting ? 'Saving...' : 'Save to Gallery'}
          </Button>

          <Button
            mode="outlined"
            onPress={handleShareVideo}
            disabled={isExporting || isSharing}
            style={styles.button}
            icon="share"
          >
            {isSharing ? 'Sharing...' : 'Share Video'}
          </Button>
        </View>

        <Text style={styles.infoText}>
          Video will be saved to your device's photo library in the "Travel Route Videos" album.
        </Text>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  divider: {
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    marginVertical: 8,
    height: 8,
    borderRadius: 4,
  },
  buttonContainer: {
    gap: 12,
    marginBottom: 16,
  },
  button: {
    marginVertical: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default VideoExportComponent;
