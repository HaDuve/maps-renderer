# FrameCaptureService Refactoring Summary

## Overview

Successfully refactored the `FrameCaptureService` from a class-based approach to a function-based approach using React hooks, following React Native guidelines and modern functional programming patterns.

## What Was Refactored

### Before (Class-Based Approach)

- **FrameCaptureService class**: Traditional OOP approach with private properties and methods
- **Instance-based usage**: Required creating new instances with `new FrameCaptureService()`
- **Manual state management**: Class properties managed state internally
- **Callback-based progress**: Progress updates via callback functions

### After (Function-Based Approach)

- **useFrameCapture hook**: Modern React hook following functional programming principles
- **Hook-based usage**: Simple `const frameCapture = useFrameCapture(options)` pattern
- **React state management**: Uses `useState` and `useCallback` for reactive state
- **Integrated progress tracking**: Progress state is part of the hook's return value

## Key Changes Made

### 1. **Replaced Class with Custom Hook**

```typescript
// Before: Class-based
const frameService = new FrameCaptureService(options);

// After: Hook-based
const frameCapture = useFrameCapture(options);
```

### 2. **State Management Transformation**

```typescript
// Before: Class private properties
private isCapturing: boolean = false;
private capturedFrames: CapturedFrame[] = [];
private tempDirectory: string;

// After: React state hooks
const [state, setState] = useState<FrameCaptureState>({
  isCapturing: false,
  capturedFrames: [],
  tempDirectory: null,
  // ... other state properties
});
```

### 3. **Method Transformation**

```typescript
// Before: Class methods
async startCapture(): Promise<void> { ... }
async captureFrame(...): Promise<CapturedFrame | null> { ... }

// After: Hook functions
const startCapture = useCallback(async (...): Promise<void> => { ... }, []);
const captureFrame = useCallback(async (...): Promise<CapturedFrame | null> => { ... }, []);
```

### 4. **Progress Tracking Integration**

```typescript
// Before: Separate callback mechanism
setProgressCallback(callback: (progress: FrameCaptureProgress) => void)

// After: Integrated state
const frameCapture = useFrameCapture();
// Access progress directly: frameCapture.progress
```

## Benefits of the Refactoring

### 1. **React Native Guidelines Compliance**

- ✅ Follows React hooks patterns
- ✅ Uses functional components approach
- ✅ Leverages React's built-in state management
- ✅ Better integration with React component lifecycle

### 2. **Improved Developer Experience**

- ✅ Simpler API: no need to instantiate classes
- ✅ Better TypeScript support with proper interfaces
- ✅ Reactive state updates trigger component re-renders
- ✅ Easier testing and mocking

### 3. **Better Performance**

- ✅ React's optimized re-rendering
- ✅ Proper dependency arrays with useCallback
- ✅ Automatic cleanup on component unmount
- ✅ No unnecessary object instantiation

### 4. **Enhanced State Management**

- ✅ Centralized state in one place
- ✅ Automatic state synchronization
- ✅ Better error handling and state updates
- ✅ Progress tracking built into the hook

## Technical Implementation Details

### Hook Structure

```typescript
export const useFrameCapture = (initialOptions?: Partial<FrameCaptureOptions>): UseFrameCaptureReturn => {
  // State management
  const [state, setState] = useState<FrameCaptureState>({...});

  // Refs for mutable values
  const optionsRef = useRef<FrameCaptureOptions>({...});
  const onProgressCallbackRef = useRef<((progress: FrameCaptureProgress) => void) | null>(null);

  // Memoized functions
  const startCapture = useCallback(async () => {...}, []);
  const captureFrame = useCallback(async () => {...}, []);

  return { ...state, startCapture, captureFrame, ... };
};
```

### State Interface

```typescript
export interface FrameCaptureState {
  isCapturing: boolean;
  capturedFrames: CapturedFrame[];
  progress: FrameCaptureProgress;
  error: string | null;
  tempDirectory: string | null;
}
```

### Return Interface

```typescript
export interface UseFrameCaptureReturn
  extends FrameCaptureState,
    FrameCaptureActions {
  setProgressCallback: (
    callback: (progress: FrameCaptureProgress) => void
  ) => void;
  updateOptions: (newOptions: Partial<FrameCaptureOptions>) => void;
}
```

## Usage Examples

### Basic Usage

```typescript
const RecordableRouteMap = () => {
  const frameCapture = useFrameCapture({
    fps: 30,
    quality: 1.0,
    format: "png",
  });

  const startRecording = async () => {
    await frameCapture.startCapture();
    // frameCapture.isCapturing is now true
  };

  return (
    <View>
      {frameCapture.isCapturing && <Text>Recording...</Text>}
      {frameCapture.error && <Text>Error: {frameCapture.error}</Text>}
      <Text>Frames: {frameCapture.capturedFrames.length}</Text>
    </View>
  );
};
```

### Progress Tracking

```typescript
const frameCapture = useFrameCapture();

// Progress is automatically tracked
console.log(`Progress: ${frameCapture.progress.percentage * 100}%`);
console.log(
  `Frames: ${frameCapture.progress.current}/${frameCapture.progress.total}`
);
```

## Backward Compatibility

### Legacy Class Export

The original `FrameCaptureService` class is still exported for backward compatibility:

```typescript
// Legacy export for backward compatibility (deprecated)
export class FrameCaptureService {
  private hookInstance: UseFrameCaptureReturn;

  constructor(options: Partial<FrameCaptureOptions> = {}) {
    this.hookInstance = useFrameCapture(options);
  }

  // Wrapper methods that delegate to the hook
  async startCapture(): Promise<void> {
    return this.hookInstance.startCapture();
  }
  // ... other methods
}
```

**Note**: This is deprecated and should not be used in new code. Use the `useFrameCapture` hook instead.

## Files Modified

### 1. `src/services/FrameCaptureService.ts`

- ✅ Added `useFrameCapture` hook
- ✅ Added new interfaces for state and actions
- ✅ Maintained backward compatibility with legacy class
- ✅ Updated all methods to use React hooks

### 2. `src/components/RecordableRouteMap/RecordableRouteMap.tsx`

- ✅ Updated to use `useFrameCapture` hook
- ✅ Removed class-based service instantiation
- ✅ Simplified state management
- ✅ Better error handling and progress tracking

## Migration Guide

### For Existing Code

1. **Replace class instantiation**:

   ```typescript
   // Before
   const frameService = new FrameCaptureService(options);

   // After
   const frameCapture = useFrameCapture(options);
   ```

2. **Update method calls**:

   ```typescript
   // Before
   await frameService.startCapture();
   const frames = await frameService.stopCapture();

   // After
   await frameCapture.startCapture();
   const frames = await frameCapture.stopCapture();
   ```

3. **Access state directly**:

   ```typescript
   // Before
   if (frameService.isCapturing) { ... }

   // After
   if (frameCapture.isCapturing) { ... }
   ```

### For New Code

- Use `useFrameCapture` hook directly
- Leverage the integrated state management
- Take advantage of automatic progress tracking
- Use the reactive state updates for UI

## Conclusion

This refactoring successfully transforms the `FrameCaptureService` from a traditional class-based approach to a modern, React-native functional approach. The new `useFrameCapture` hook provides:

- **Better React integration** with hooks and state management
- **Improved developer experience** with simpler APIs
- **Enhanced performance** through React's optimization
- **Better maintainability** with functional programming patterns
- **Full backward compatibility** for existing code

The refactored service now follows React Native best practices and provides a more intuitive, reactive interface for frame capture functionality.
