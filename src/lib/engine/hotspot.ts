/**
 * CivicFlow Geographic Hotspot Clustering Utility
 * 
 * Identifies spatial concentrations of civic complaints for municipal triage.
 * 
 * Rules & Parameters:
 * - Distance threshold: 250 metres (HOTSPOT_DISTANCE_THRESHOLD_METERS = 250)
 * - Minimum reports per cluster: 3 (HOTSPOT_MIN_REPORTS = 3)
 * - Returns: Cluster ID, report count, member report IDs, and approximate centre (centroid)
 * 
 * Algorithm:
 * - Computes pairwise Haversine distances to build spatial adjacency.
 * - Discovers connected components of spatial density within 250m.
 * - Filters to components meeting or exceeding the minimum 3-report threshold.
 * - Computes geographic centroid (mean lat, mean lng) and bounding radius.
 * - Sorts clusters by report count descending for immediate municipal triage.
 */

import { Location } from "../../types";
import { calculateHaversineDistance } from "./duplicate";

export const HOTSPOT_DISTANCE_THRESHOLD_METERS = 250;
export const HOTSPOT_MIN_REPORTS = 3;

export interface HotspotReport {
  id: string;
  location: Location;
  category?: string;
  status?: string;
}

export interface HotspotCluster {
  clusterId: string;
  reportCount: number;
  reportIds: string[];
  center: Location;
  radiusMeters: number;
  categories: Record<string, number>;
}

export interface HotspotClusteringResult {
  totalReports: number;
  clusteredReportsCount: number;
  clustersCount: number;
  clusters: HotspotCluster[];
}

/**
 * Computes geographic centroid of a group of locations.
 */
export function calculateCentroid(locations: Location[]): Location {
  if (locations.length === 0) {
    return { lat: 0, lng: 0 };
  }

  const sumLat = locations.reduce((acc, loc) => acc + loc.lat, 0);
  const sumLng = locations.reduce((acc, loc) => acc + loc.lng, 0);

  return {
    lat: Number((sumLat / locations.length).toFixed(6)),
    lng: Number((sumLng / locations.length).toFixed(6)),
  };
}

/**
 * Groups complaints into spatial hotspots using a 250m radius and minimum 3 reports.
 */
export function detectHotspots(
  reports: HotspotReport[],
  distanceThreshold = HOTSPOT_DISTANCE_THRESHOLD_METERS,
  minReports = HOTSPOT_MIN_REPORTS
): HotspotClusteringResult {
  const n = reports.length;
  if (n < minReports) {
    return {
      totalReports: n,
      clusteredReportsCount: 0,
      clustersCount: 0,
      clusters: [],
    };
  }

  // 1. Build adjacency list of reports within distanceThreshold
  const adjacency: number[][] = Array.from({ length: n }, () => []);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dist = calculateHaversineDistance(reports[i].location, reports[j].location);
      if (dist <= distanceThreshold) {
        adjacency[i].push(j);
        adjacency[j].push(i);
      }
    }
  }

  // 2. Discover connected spatial components using BFS
  const visited = new Uint8Array(n);
  const rawClusters: number[][] = [];

  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;

    const component: number[] = [];
    const queue: number[] = [i];
    visited[i] = 1;

    while (queue.length > 0) {
      const curr = queue.shift()!;
      component.push(curr);

      for (const neighbor of adjacency[curr]) {
        if (!visited[neighbor]) {
          visited[neighbor] = 1;
          queue.push(neighbor);
        }
      }
    }

    if (component.length >= minReports) {
      rawClusters.push(component);
    }
  }

  // 3. Transform components into structured HotspotCluster objects
  let clusteredReportsCount = 0;
  const clusters: HotspotCluster[] = rawClusters.map((memberIndices, index) => {
    clusteredReportsCount += memberIndices.length;
    const memberReports = memberIndices.map((idx) => reports[idx]);
    const locations = memberReports.map((r) => r.location);
    const center = calculateCentroid(locations);

    // Calculate maximum radius from centroid to any member
    let maxRadius = 0;
    for (const loc of locations) {
      const dist = calculateHaversineDistance(center, loc);
      if (dist > maxRadius) {
        maxRadius = dist;
      }
    }

    // Tally category breakdown
    const categories: Record<string, number> = {};
    for (const rep of memberReports) {
      const cat = rep.category || "uncategorized";
      categories[cat] = (categories[cat] || 0) + 1;
    }

    return {
      clusterId: `cluster_${index + 1}`,
      reportCount: memberReports.length,
      reportIds: memberReports.map((r) => r.id),
      center,
      radiusMeters: Number(maxRadius.toFixed(1)),
      categories,
    };
  });

  // Sort clusters descending by report density
  clusters.sort((a, b) => b.reportCount - a.reportCount);

  // Re-index clusters after sorting
  clusters.forEach((c, idx) => {
    c.clusterId = `hotspot_cluster_${idx + 1}`;
  });

  return {
    totalReports: n,
    clusteredReportsCount,
    clustersCount: clusters.length,
    clusters,
  };
}
