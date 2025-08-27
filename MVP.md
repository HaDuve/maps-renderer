# Travel Map Animation MVP (React Native Expo)

## Overview

This MVP aims to create a competitive travel route animation app similar to Mult.dev, TravelAnimator, and TravelBoast. The app will allow users to create and share animated travel routes on maps, with the ability to export high-quality video animations.

## Technical Stack

- **Framework**: React Native with Expo
- **Map Integration**: React Native Maps with Google Maps provider
- **Animation**: React Native Reanimated for smooth animations
- **Video Generation**: Frame-based capture with FFmpeg for video encoding
- **UI Components**: React Native Paper for consistent, material design
- **Storage**: Expo FileSystem and AsyncStorage for local data
- **Location**: Expo Location for geolocation services
- **Media Handling**: Expo MediaLibrary and Expo Sharing for video export

## Core Features for MVP

### 1. Route Creation and Management

- Waypoint creation and management on interactive map
- Support for importing GPX, KML, or GeoJSON files (like Strava, Gaia)
- Custom route naming and metadata
- Save and load routes from local storage

### 2. Map Animation

- Smooth animations between waypoints with configurable speed
- Multiple transportation modes with appropriate icons (plane, car, walk, etc.)
- Camera animations that follow the journey path
- Timeline scrubbing for manual control

### 3. Video Export

- Frame capture system using react-native-view-shot (30fps)
- Video encoding using FFmpeg (via dev build or server-side)
- Quality settings (low, medium, high)
- Support for various output resolutions (720p, 1080p)

### 4. Sharing

- Export to device gallery
- Direct sharing to social media platforms
- Video preview before sharing

## Technical Implementation Details

### Map Rendering

```typescript
// Core map component with animation capabilities
const AnimatedRouteMap = (props: {
  route: Route;
  animationOptions: AnimationOptions;
  onAnimationComplete: (videoUri: string) => void;
}) => {
  // Implementation with MapView, Markers, and animation logic
};
```

### Frame Capture System

```typescript
// Service for capturing frames during animation
class VideoRecordingService {
  // Frame capture using react-native-view-shot
  // Frame sequence management
  // Temp file handling
}
```

### Video Encoding

For Expo managed workflow, we'll use one of these approaches:

1. **Server-side Processing**:

   - Upload frames to a server via API
   - Process with FFmpeg server-side
   - Return video URL for download

2. **Dev Build with FFmpeg**:
   - Include ffmpeg-kit-react-native in Expo dev build
   - Process frames locally on device
   - Higher quality but requires custom build

### Data Models

```typescript
// Core data models
type Coordinate = {
  latitude: number;
  longitude: number;
};

type Waypoint = {
  id: string;
  coordinate: Coordinate;
  name?: string;
  description?: string;
  timestamp: number;
};

type Route = {
  id: string;
  waypoints: Waypoint[];
  metadata: RouteMetadata;
  transportationType: TransportationType;
};

enum TransportationType {
  PLANE,
  CAR,
  WALK,
  BICYCLE,
  TRAIN,
  BOAT,
}
```

## Technical Challenges and Solutions

### Challenge 1: Smooth Animation Rendering

**Solution**: Use React Native Reanimated for performance-optimized animations, with worklets to handle animation logic on the UI thread.

### Challenge 2: Video Generation in React Native

**Solution**: Implement a frame capture system that takes snapshots of the map view at consistent intervals, then compiles these frames into a video using FFmpeg (either via server-side processing or using an Expo dev build with ffmpeg-kit-react-native).

### Challenge 3: Memory Management During Recording

**Solution**: Implement progressive file cleanup to avoid memory issues with long animations. Store frames in temporary storage and clean up after processing.

### Challenge 4: Map Style Customization

**Solution**: Implement a theme system that applies consistent styling to map elements based on selected themes, using MapView's customMapStyle prop.

## Implementation Roadmap

1. **Basic Map Setup** - Implement core map view with waypoint display
2. **Animation System** - Create smooth animations between waypoints
3. **Route Management** - Implement route creation, editing, and storage
4. **Frame Capture** - Develop the frame capture system
5. **Video Export** - Implement video generation from captured frames
6. **Sharing Features** - Add gallery export and social sharing
7. **UI Refinement** - Polish the interface and user experience

## Performance Optimization

- Use Reanimated's worklets for animations to offload from JS thread
- Implement frame caching for preview generation
- Optimize MapView rendering with useNativeDriver where possible
- Configure proper memory management for video generation

## Monetization Options

- **Freemium Model**: Basic features free, premium features paid
- **Subscription**: Access to advanced export options and map styles
- **Pay Per Export**: Free creation but paid high-quality exports
- **One-time Purchase**: Unlock all features permanently

## Competitive Advantages

- **Better Performance**: Optimized React Native animations
- **Higher Quality Exports**: Professional-grade video output
- **Intuitive Interface**: Simplified creation process compared to competitors
- **Flexible Import/Export**: Support for various file formats and sharing options

## Future Enhancements (Post-MVP)

- Custom overlay support (text, images, logos)
- Audio track integration
- Advanced transitions between waypoints
- Template library for quick creation
- Cloud storage for routes
