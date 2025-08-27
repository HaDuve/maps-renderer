import { useState } from "react";
import { VideoExportService } from "../../services/VideoExportService";
import { TProps, TController } from "./types";

export const useController = (props: TProps): TController => {
  const { videoUri } = props;

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
        setExportProgress((prev) => Math.min(prev + 0.1, 0.9));
      }, 200);

      const albumName = "Travel Route Videos";
      const asset = await exportService.saveVideoToGallery(videoUri, albumName);

      clearInterval(progressInterval);
      setExportProgress(1);

      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);

      console.log("Video saved:", asset);
    } catch (error) {
      exportService.handleError(error as Error, "save video");
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleShareVideo = async () => {
    try {
      setIsSharing(true);
      await exportService.shareVideo(videoUri);
    } catch (error) {
      exportService.handleError(error as Error, "share video");
    } finally {
      setIsSharing(false);
    }
  };

  const getStorageInfo = async () => {
    const info = await exportService.getStorageInfo();
    if (info) {
      console.log("Storage info:", info);
    }
  };

  return {
    isExporting,
    exportProgress,
    isSharing,
    exportService,
    handleSaveToGallery,
    handleShareVideo,
    getStorageInfo,
  };
};
