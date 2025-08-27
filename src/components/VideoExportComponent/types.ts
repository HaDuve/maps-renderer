import { VideoExportService } from "../../services/VideoExportService";

export type TProps = {
  videoUri: string;
  routeName: string;
};

export type TController = {
  isExporting: boolean;
  exportProgress: number;
  isSharing: boolean;
  exportService: VideoExportService;
  handleSaveToGallery: () => Promise<void>;
  handleShareVideo: () => Promise<void>;
  getStorageInfo: () => Promise<void>;
};
