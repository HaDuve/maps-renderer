# Video Generation Approaches for Map Animation

This document explores various approaches to generating videos from map animations in a React Native Expo application, evaluating alternatives to the current frame capture + FFmpeg solution.

## Current Approach

The current implementation uses:

- `react-native-view-shot` to capture frames from the map view
- Sequential PNG frames stored temporarily
- FFmpeg for video encoding (planned but not implemented)

### Limitations

- Requires FFmpeg, which adds complexity in an Expo managed workflow
- Memory-intensive due to storing many high-resolution frames
- Potentially slow encoding process on mobile devices

## Alternative Approaches

### 1. Video Editor SDKs

Several specialized Video Editor SDKs offer comprehensive solutions for video generation:

#### a. React Native Video Editor SDK (VESDK)

- **Features**: Transformations, trimming, video composition, overlays, filters
- **Advantages**:
  - Optimized for performance
  - Customizable UI
  - Handles complex video processing tasks efficiently
  - Available as Expo config plugin
- **Integration**: Compatible with React Native 0.60+ and Expo 45+
- **Considerations**: Requires Expo dev build (not compatible with Expo Go)

#### b. Banuba Video Editor SDK

- **Features**: Real-time effects, AR overlays, face tracking, AI-powered editing
- **Advantages**:
  - Comprehensive documentation
  - Optimized for mobile platforms
  - Specialized in visual effects
- **Considerations**: May require ejecting from Expo managed workflow

#### c. KineMaster SDK

- **Features**: Multi-layer editing, audio mixing, transitions, real-time previews
- **Advantages**:
  - Robust API
  - Proven performance in commercial applications
- **Considerations**: May be more feature-rich than needed for map animations

#### d. VideoKit

- **Features**: Trimming, cropping, merging, text overlays, transitions
- **Advantages**:
  - Flexible architecture
  - Custom UI components and themes
- **Considerations**: Feature set may exceed requirements for map animations

### 2. WebAssembly-based Approaches

#### FFmpeg.wasm

- **Concept**: Use FFmpeg compiled to WebAssembly in React Native
- **Advantages**:
  - Runs FFmpeg directly in JavaScript context
  - No native module dependencies
  - Compatible with Expo managed workflow
- **Challenges**:
  - Performance limitations on mobile devices
  - Memory constraints for larger videos
  - Limited browser/WebView support for WebAssembly in React Native

### 3. Native Module Integration

#### React Native FFmpeg

- **Implementation**: Use `ffmpeg-kit-react-native` in Expo dev build
- **Advantages**:
  - Native performance
  - Full FFmpeg functionality
  - Better memory management
- **Considerations**:
  - Requires Expo dev build or ejecting
  - More complex setup than managed workflow

### 4. Cloud-based Processing

#### Server-side Video Generation

- **Implementation**: Upload frames to server, process with FFmpeg, return video URL
- **Advantages**:
  - Offloads processing from mobile device
  - Faster processing with server resources
  - No device compatibility concerns
- **Considerations**:
  - Requires internet connectivity
  - Additional server costs
  - Potential latency during upload/download

### 5. Animation Libraries with Export Capabilities

#### Lottie Integration

- **Concept**: Use Lottie animations for map animations, then capture/export
- **Advantages**:
  - Smooth vector-based animations
  - Lower memory footprint
  - Better performance for simple animations
- **Limitations**:
  - Limited interactivity with real maps
  - Complex to implement for map-based animations
  - Still requires a video generation step

### 6. Screen Recording APIs

#### React Native Screen Capture

- **Implementation**: Use native screen recording APIs through React Native modules
- **Advantages**:
  - Records exactly what user sees
  - Potentially simpler than frame-by-frame capture
- **Limitations**:
  - Inconsistent across platforms
  - May require permissions
  - Limited control over quality

## Recommendation for MVP

Based on the research, the most effective approaches for the MVP appear to be:

1. **For Managed Expo Workflow**:

   - Continue with frame capture approach
   - Implement server-side processing for video generation
   - Optimize frame capture frequency and resolution

2. **For Expo Dev Build**:

   - Integrate React Native Video Editor SDK (VESDK) via Expo config plugin
   - Leverage its optimized video processing capabilities
   - Utilize built-in sharing and export features

3. **For Complete Flexibility**:
   - Eject from Expo managed workflow
   - Integrate `ffmpeg-kit-react-native` for local processing
   - Implement custom UI for video generation progress

## Next Steps

1. Evaluate the trade-offs between managed workflow convenience and native module capabilities
2. Test performance of frame capture at different resolutions and frame rates
3. If using server-side approach, design and implement secure API for frame upload and video processing
4. Conduct performance testing on various device models to ensure smooth operation
