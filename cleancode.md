# Clean Code Guidelines for React Native

This document outlines the clean code standards and best practices for our React Native project.

## Project Structure

### Folder Organization

- Files should be organized in subfolders based on their screen/functionality
- Use feature-based organization rather than type-based organization
- Components should be organized in a modular way to promote reusability

### File Structure

Each (sub)folder should contain:

- **Barrel file**: `index.ts` that exports all components/hooks/utilities from the folder
- **Types file**: `types.ts` which includes all relevant types prefixed with T (TProps, TController, etc.)
- **Styles file**: `styles.ts` which includes all relevant styles (react native sylesheet) exported to the component file
- **Controller file**: `controller.ts` containing a custom `useController` hook with component logic (must NOT contain any JSX code)
- **Component file**: `.tsx` file containing the UI rendering logic and JSX code

**Important**:

- There should be NO component.tsx files in the components directory that simply re-export the actual component
- Components should only be exported through their respective directory's index.ts file

Example of a feature folder:

```
/Map
  ├── index.ts         # Barrel file exporting the component
  ├── types.ts         # All types related to the Map component
  ├── controller.ts    # useController hook with component logic
  ├── Map.tsx          # UI rendering component
  └── components/      # Sub-components used only by Map
      ├── index.ts
      └── ...
```

## TypeScript Guidelines

- Always use TypeScript, never plain JavaScript
- Use `type` instead of `interface` for consistency
- Define proper return types for all functions
- Avoid using `any` type - use proper typing or `unknown` if type is truly uncertain
- Use union types for variables that can have multiple types
- Use generics where appropriate for reusable components/functions

## Component Architecture

- Follow a controller pattern by separating logic from UI
- Component files (.tsx) should only contain rendering logic, JSX, and minimal state
- Controller files (.ts) must never contain JSX code - only pure TypeScript logic
- All business logic, API calls, and complex state management should be in controller hooks
- Props should be properly typed using the types defined in the types.ts file

Example component structure:

```tsx
// Map.tsx
import { useController } from './controller';
import { TProps } from './types';

export const Map = (props: TProps) => {
  const { locations, isLoading, handleMarkerPress } = useController(props);

  return (
    // UI rendering using the variables from controller
  );
};
```

## Naming Conventions

- Use PascalCase for components and component files: `MapView.tsx`
- Use camelCase for utilities, hooks, and non-component files: `useController.ts`
- Use prefixes consistently:
  - `T` for types: `TProps`, `TMapState`
  - `use` for hooks: `useController`, `useMapSettings`
- Export components as named exports, not default exports

## State Management

- Keep state as close to where it's used as possible
- Lift state up only when necessary
- Use appropriate state management based on complexity:
  - Component state for simple, isolated state
  - Zustand for complex state management between components

## Imports and Exports

- Use barrel files (index.ts) to simplify imports
- Each directory should have a barrel file (index.ts) that exports its contents
- Component folders should ONLY export their main component from index.ts (not controllers, types, or styles)
  - Example: `export * from './ComponentName'` NOT `export * from './controller'`
  - This prevents name conflicts when importing from multiple components
- Use path aliases for imports to improve readability and maintainability
  - Example: `import { Component } from "@components"` instead of `import { Component } from "../../../components/Component"`
  - Common aliases to use:
    - `@components` for src/components
    - `@services` for src/services
    - `@types` for src/types
    - `@app` for src/App
- Prefer importing from the barrel file without specifying the full path
  - Example: `import { Route } from "@types"` instead of `import { Route } from "@types/Route"`
- Organize imports in the following order:
  1. External libraries
  2. Internal absolute paths (using aliases)
  3. Local relative imports
  4. Style/asset imports
- Avoid circular dependencies

## Performance Considerations

- Use React.memo() for expensive rendering components
- Implement useMemo() and useCallback() for optimized performance
- Virtualize long lists with FlatList or FlashList
- Use proper image optimization techniques
- Avoid anonymous function creation in render methods

## Code Style

- Prefer functional components over class components
- Use destructuring for props and state
- Use optional chaining (?.) and nullish coalescing (??) operators
- Use meaningful variable and function names
- Keep functions small and focused on a single responsibility

## Testing

- Write tests "Component.test.tsx" for all components and their respective logic
- Use Jest for Testing
- Unit tests for smokescreen and any logic

## Documentation

- Write code so readable that comments are not needed
- Do NOT use JSDoc
- Keep .md files updated for each major feature
- Document API interfaces and data structures in respective .md files (eg: database.md)

By following these guidelines, we can maintain a clean, scalable, and maintainable React Native codebase.
