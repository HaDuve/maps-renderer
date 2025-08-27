/**
 * Represents a geographic coordinate with latitude and longitude
 */
export interface Coordinate {
  latitude: number;
  longitude: number;
}

/**
 * Represents a waypoint in a travel route
 */
export interface Waypoint {
  id: string;
  coordinate: Coordinate;
  name?: string;
  description?: string;
  timestamp: number;
  elevation?: number;
}

/**
 * Metadata for a travel route
 */
export interface RouteMetadata {
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  difficulty?: 'easy' | 'moderate' | 'hard';
  estimatedDuration?: number;
}

/**
 * Complete travel route definition
 */
export interface Route {
  id: string;
  waypoints: Waypoint[];
  metadata: RouteMetadata;
  totalDistance?: number;
}
