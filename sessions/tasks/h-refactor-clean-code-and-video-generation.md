---
task: h-refactor-clean-code-and-video-generation
branch: feature/clean-code-and-video-generation
status: in-progress
created: 2025-09-01
started: 2025-09-01
modules: [App, components, services, types]
---

# Clean Code and Enhance Video Generation

## Problem/Goal
Remove AI-generated code that may be bloated or poorly structured, and enhance the existing Google Maps waypoint animation system to generate proper video outputs. The current codebase has frame capture and video services but needs cleanup and proper video generation functionality.

## Success Criteria
- [ ] Remove unnecessary AI-generated code and improve code quality
- [ ] Refactor existing services to follow clean code principles
- [ ] Implement proper video generation from Google Maps waypoint animations
- [ ] Ensure video export functionality works seamlessly
- [ ] Maintain existing functionality while improving code structure
- [ ] Add proper error handling and validation

## Context Files
<!-- Added by context-gathering agent or manually -->
- @src/services/VideoRecordingService.ts          # Video recording functionality
- @src/services/VideoExportService.ts             # Video export functionality  
- @src/services/FrameCaptureService.ts            # Frame capture service
- @src/components/VideoExportComponent/           # Video export UI component
- @src/components/RecordableRouteMap/             # Map recording component
- @cleancode.md                                   # Code quality guidelines

## Context Manifest

### How This Currently Works: Google Maps Waypoint Animation & Video Generation System

When a user creates a travel route, they interact with a React Native Expo application structured around three main tabs: Create Route, Animate, and Export. The application follows a feature-based folder organization with controller-view separation as defined in cleancode.md guidelines.

The core workflow begins when users define waypoints through the RouteInputForm component, which feeds data into the main App controller via handleSaveRoute. The App controller manages the global state including currentRoute, recordedVideoUri, and navigation index using React hooks. The Route data structure includes waypoints (with coordinates, names, timestamps), and metadata (name, description, creation dates).

For animation and recording, the system centers around the RecordableRouteMap component which integrates Google Maps (react-native-maps) with a sophisticated frame capture system. The component uses the recently refactored useFrameCapture hook (previously a class-based FrameCaptureService) that manages frame capture state, progress tracking, and temporary file operations. When recording starts, the system:

1. **Animation Phase**: Uses setInterval to animate between waypoints every 3 seconds (ANIMATION_SPEED constant), calling mapRef.current.animateToRegion() to smoothly transition the map view between coordinates
2. **Frame Capture Phase**: Simultaneously captures frames at 30fps (FRAME_CAPTURE_INTERVAL = 1000/30ms) using react-native-view-shot's captureRef function, saving each frame as PNG/JPG to temporary directory via Expo FileSystem
3. **Synchronization**: Both intervals run in parallel - the animation moves the map while frame capture continuously saves screenshots

The frame capture implementation captures TOTAL_FRAMES_PER_WAYPOINT (30) frames per waypoint, generating data-URI formatted images that get written to the device's cache directory. Each frame includes metadata (index, timestamp, URI) and progress tracking updates the UI.

For video generation, the current VideoRecordingService has a significant limitation - the createVideoFromFrames method only creates a placeholder file rather than an actual video. This is because React Native Expo managed workflow doesn't natively support FFmpeg for video encoding. The service simply copies the first frame as a placeholder PNG file, which is inadequate for the video generation requirement.

The VideoExportService handles the final output, providing methods to save videos to the device's photo gallery (using Expo MediaLibrary) and share videos via the native sharing interface (using Expo Sharing). It includes proper permission handling, storage space checking, and error management with user-friendly messages.

The architectural pattern follows cleancode.md conventions with strict controller-view separation. Each component has a corresponding controller.ts file containing business logic as a useController hook, types.ts for TypeScript definitions, and the main component file for UI rendering only. This separation is evident in VideoExportComponent where the controller manages export state and the component handles only UI rendering.

### For New Feature Implementation: What Needs Cleanup and Enhancement

The current codebase shows clear signs of AI-generated bloat, particularly in verbose logging throughout FrameCaptureService and overly complex state management patterns that don't follow React best practices. The recent refactoring from class-based to hook-based patterns was good, but there are still inconsistencies in how different services handle state and errors.

The primary gap is in video generation - the VideoRecordingService's createVideoFromFrames method needs complete reimplementation. Based on VIDEO_GENERATION_APPROACHES.md analysis, we have several viable options:

1. **Server-side processing**: Upload captured frames to a backend service running FFmpeg, return processed video URL
2. **Expo dev build with FFmpeg**: Use ffmpeg-kit-react-native but requires ejecting from managed workflow  
3. **Third-party video services**: Integrate specialized video processing SDKs

The frame capture system itself works well but needs optimization. The current approach captures frames as data-URIs and writes them individually to file system, which is memory-intensive. We could optimize by reducing frame resolution, adjusting capture frequency, or implementing progressive cleanup of processed frames.

Error handling across services is inconsistent - VideoExportService has comprehensive error handling with user-friendly messages and suggested actions, while FrameCaptureService mostly logs to console. The app needs unified error handling patterns with proper user feedback.

State management could be simplified by removing unnecessary progress simulation (like in VideoExportComponent controller) and consolidating similar state patterns across components. The App controller currently creates sample data on mount which is development scaffolding that should be removed.

The current video workflow assumes the "video" (actually just a static image) will be successfully processed, but users never get actual video output. This creates a broken user experience where the export functionality appears to work but delivers wrong results.

### Technical Reference Details

#### Component Interfaces & Signatures

**Core Services:**
```typescript
// FrameCaptureService (Hook-based)
export const useFrameCapture = (initialOptions?: Partial<FrameCaptureOptions>): UseFrameCaptureReturn
interface FrameCaptureOptions { fps: number; quality: number; format: "png" | "jpg"; width?: number; height?: number; }
interface CapturedFrame { uri: string; index: number; timestamp: number; }

// VideoRecordingService (Class-based - needs refactoring)
export class VideoRecordingService {
  async createVideoFromFrames(frames: FrameData[]): Promise<string> // Currently broken - returns placeholder
  async captureFrame(viewRef: any, frameIndex: number): Promise<void>
}

// VideoExportService (Class-based)
export class VideoExportService {
  async saveVideoToGallery(videoUri: string, albumName: string = 'Travel Routes'): Promise<MediaLibrary.Asset>
  async shareVideo(videoUri: string): Promise<void>
}
```

**Component Controllers:**
```typescript
// App Controller
const useController = (props: TAppProps): TController => ({
  currentRoute: Route | null,
  handleVideoCreated: (videoUri: string) => void,
  handleSaveRoute: (routeData: Partial<Route>) => void,
  // ... waypoint management functions
})

// VideoExportComponent Controller  
const useController = (props: TProps): TController => ({
  isExporting: boolean,
  exportProgress: number,
  handleSaveToGallery: () => Promise<void>,
  handleShareVideo: () => Promise<void>
})
```

#### Data Structures

**Route System:**
```typescript
type Coordinate = { latitude: number; longitude: number; }
type Waypoint = { id: string; coordinate: Coordinate; name?: string; timestamp: number; }
type Route = { id: string; waypoints: Waypoint[]; metadata: RouteMetadata; totalDistance?: number; }
```

**Frame Capture:**
```typescript
interface FrameCaptureState {
  isCapturing: boolean;
  capturedFrames: CapturedFrame[];
  progress: { total: number; current: number; percentage: number };
  error: string | null;
  tempDirectory: string | null;
}
```

#### Configuration Requirements

**Environment & Dependencies:**
- React Native: 0.79.6, React: 19.0.0, Expo SDK ~53.0.22
- Key packages: react-native-maps, react-native-view-shot, expo-file-system, expo-media-library, expo-sharing
- Clean code conventions from cleancode.md must be followed
- Controller-view separation required for all components

**Performance Constants:**
```typescript
const ANIMATION_SPEED = 3000; // 3000ms between waypoints  
const FRAME_CAPTURE_INTERVAL = 1000 / 30; // 30fps
const TOTAL_FRAMES_PER_WAYPOINT = 30; // 1 second per waypoint
```

#### File Locations

**Implementation goes here:**
- Main refactoring: `/src/services/VideoRecordingService.ts` - Replace createVideoFromFrames with actual video generation
- Cleanup targets: Remove excessive logging from `/src/services/FrameCaptureService.ts`
- Error handling: Standardize patterns across `/src/services/VideoExportService.ts`
- Controller cleanup: `/src/App/controller.ts` - Remove sample data generation
- Component optimization: `/src/components/RecordableRouteMap/RecordableRouteMap.tsx` - Simplify state management

**Configuration files:**
- Dependencies: `/package.json` - May need additional packages for video generation
- TypeScript config: `/tsconfig.json`, babel config for path aliases

**Testing locations:**
- Component tests: `/src/components/*/ComponentName.test.tsx` (following cleancode.md testing guidelines)
- Service tests: `/src/services/*.test.ts`

## User Notes
<!-- Any specific notes or requirements from the developer -->
- Focus on removing bloated AI-generated code
- Improve the Google Maps waypoint animation to video workflow
- Maintain existing functionality while cleaning up codebase
- Ensure video generation is robust and user-friendly

## Work Log
<!-- Updated as work progresses -->
- [2025-09-01] Created task for code cleanup and video generation enhancement