import test from "node:test";
import assert from "node:assert/strict";
import {
  detectHotspots,
  calculateCentroid,
  HOTSPOT_DISTANCE_THRESHOLD_METERS,
  HOTSPOT_MIN_REPORTS,
  HotspotReport,
} from "../src/lib/engine/hotspot";

test("Hotspot Clustering: returns 0 clusters when reports count < 3", () => {
  assert.equal(HOTSPOT_MIN_REPORTS, 3);
  const sparseReports: HotspotReport[] = [
    { id: "r1", location: { lat: 12.9716, lng: 77.5946 }, category: "road_damage" },
    { id: "r2", location: { lat: 12.9720, lng: 77.5946 }, category: "road_damage" },
  ];

  const result = detectHotspots(sparseReports);
  assert.equal(result.clustersCount, 0);
  assert.equal(result.clusters.length, 0);
});

test("Hotspot Clustering: detects cluster when >= 3 reports are within 250m", () => {
  // 3 reports all within 100m of each other
  const denseReports: HotspotReport[] = [
    { id: "r1", location: { lat: 12.9716, lng: 77.5946 }, category: "waterlogging" },
    { id: "r2", location: { lat: 12.9718, lng: 77.5947 }, category: "waterlogging" },
    { id: "r3", location: { lat: 12.9720, lng: 77.5945 }, category: "drainage" },
  ];

  const result = detectHotspots(denseReports);
  assert.equal(result.clustersCount, 1);
  assert.equal(result.clusteredReportsCount, 3);

  const cluster = result.clusters[0];
  assert.equal(cluster.reportCount, 3);
  assert.deepEqual(cluster.reportIds.sort(), ["r1", "r2", "r3"]);
  assert.ok(cluster.radiusMeters < HOTSPOT_DISTANCE_THRESHOLD_METERS);
  assert.equal(cluster.categories["waterlogging"], 2);
  assert.equal(cluster.categories["drainage"], 1);
});

test("Hotspot Clustering: isolates geographically distinct clusters and sorts by density", () => {
  // Cluster A (4 reports near 12.9716, 77.5946)
  const clusterA: HotspotReport[] = [
    { id: "a1", location: { lat: 12.9716, lng: 77.5946 } },
    { id: "a2", location: { lat: 12.9718, lng: 77.5948 } },
    { id: "a3", location: { lat: 12.9717, lng: 77.5945 } },
    { id: "a4", location: { lat: 12.9719, lng: 77.5947 } },
  ];

  // Cluster B (3 reports near 13.0500, 77.6500, ~10km away)
  const clusterB: HotspotReport[] = [
    { id: "b1", location: { lat: 13.0500, lng: 77.6500 } },
    { id: "b2", location: { lat: 13.0502, lng: 77.6501 } },
    { id: "b3", location: { lat: 13.0501, lng: 77.6503 } },
  ];

  // Outlier (isolated, 20km away)
  const outlier: HotspotReport = {
    id: "outlier-1",
    location: { lat: 13.1500, lng: 77.7500 },
  };

  const allReports = [...clusterB, outlier, ...clusterA];
  const result = detectHotspots(allReports);

  assert.equal(result.clustersCount, 2);
  assert.equal(result.clusteredReportsCount, 7); // 4 + 3

  // Cluster with 4 reports is ranked #1 (density sort)
  assert.equal(result.clusters[0].reportCount, 4);
  assert.equal(result.clusters[1].reportCount, 3);

  // Outlier is NOT clustered
  const allClusteredIds = result.clusters.flatMap((c) => c.reportIds);
  assert.ok(!allClusteredIds.includes("outlier-1"));
});

test("Centroid Calculation: calculates arithmetic mean coordinate", () => {
  const locs = [
    { lat: 10, lng: 20 },
    { lat: 20, lng: 40 },
  ];
  const center = calculateCentroid(locs);
  assert.equal(center.lat, 15);
  assert.equal(center.lng, 30);
});
