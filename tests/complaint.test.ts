import test from "node:test";
import assert from "node:assert/strict";
import { createComplaint, getComplaints } from "../src/lib/services/complaints";
import { SYNTHETIC_COMPLAINTS } from "../src/lib/data/mock-complaints";
import { CATEGORIES } from "../src/lib/constants";
import { detectHotspots } from "../src/lib/engine/hotspot";

test("Synthetic Dataset Quality: meets all hackathon structural criteria", () => {
  // 1. Target count ~45
  assert.equal(SYNTHETIC_COMPLAINTS.length, 45);

  // 2. Strict labeling
  const allSynthetic = SYNTHETIC_COMPLAINTS.every((c) => c.isSynthetic === true);
  assert.equal(allSynthetic, true);

  // 3. Category diversity (all 8 categories present)
  const representedCategories = new Set(SYNTHETIC_COMPLAINTS.map((c) => c.category));
  for (const cat of CATEGORIES) {
    assert.ok(representedCategories.has(cat), `Category '${cat}' missing from synthetic dataset`);
  }

  // 4. Four urgent safety incidents triggering Safety Floor
  const urgentIncidents = SYNTHETIC_COMPLAINTS.filter((c) => c.id.startsWith("rep_urgent_"));
  assert.equal(urgentIncidents.length, 4);
  assert.ok(urgentIncidents.every((c) => c.priority.level === "critical"));

  // 5. Three duplicate groups with explicit duplicate references
  const duplicates = SYNTHETIC_COMPLAINTS.filter((c) => Boolean(c.duplicate?.ofId));
  assert.ok(duplicates.length >= 3);
  const dupIds = duplicates.map((d) => d.id);
  assert.ok(dupIds.includes("rep_dup_1b"));
  assert.ok(dupIds.includes("rep_dup_2b"));
  assert.ok(dupIds.includes("rep_dup_3b"));

  // 6. Geographic cluster with at least 6 reports
  const clustering = detectHotspots(SYNTHETIC_COMPLAINTS);
  assert.ok(clustering.clustersCount >= 1);
  const topCluster = clustering.clusters[0];
  assert.ok(topCluster.reportCount >= 6, `Expected cluster of >=6 reports, got ${topCluster.reportCount}`);
});

test("Complaint Pipeline: creates complaint with AI summary and deterministic priority", async () => {
  const result = await createComplaint(
    {
      text: "Waterlogged street corner making pedestrian crossing impossible after thunderstorm",
      category: "waterlogging",
      location: { lat: 12.9716, lng: 77.5946, address: "MG Road Junction" },
    },
    "test_citizen_uid_999"
  );

  assert.ok(result.id.startsWith("complaint_"));
  assert.equal(result.reporterUid, "test_citizen_uid_999");
  assert.equal(result.category, "waterlogging");
  assert.ok(result.summary.length > 5);
  assert.ok(result.priority.score >= 0 && result.priority.score <= 100);
  assert.ok(["critical", "high", "medium", "low"].includes(result.priority.level));
  assert.equal(result.isSynthetic, false);
});

test("Complaint Pipeline: enforces Safety Floor when immediate hazard keyword is present", async () => {
  const result = await createComplaint(
    {
      text: "Dangerous live wire sparking on ground outside hospital gate",
      category: "public_safety",
      location: { lat: 12.9716, lng: 77.5946 },
    },
    "test_citizen_uid_888"
  );

  // Live wire must trigger Critical priority (>= 75)
  assert.ok(result.priority.score >= 75);
  assert.equal(result.priority.level, "critical");
  assert.ok(result.priority.explanation.includes("SAFETY FLOOR ENFORCED"));
});

test("Complaint Retrieval: filters complaints by reporter UID", async () => {
  const citizenUid = "unique_citizen_777";

  await createComplaint(
    {
      text: "Broken street lamp post in front of house 42",
      category: "streetlight",
      location: { lat: 12.9800, lng: 77.6000 },
    },
    citizenUid
  );

  const citizenComplaints = await getComplaints({ reporterUid: citizenUid });
  assert.ok(citizenComplaints.length >= 1);
  assert.ok(citizenComplaints.every((c) => c.reporterUid === citizenUid));
});

test("Officer Resolution Workflow: updates status, records status_events, and resolves ticket", async () => {
  const { updateComplaint, getStatusEvents, getComplaintStats } = await import("../src/lib/services/complaints");

  // 1. Create a fresh complaint
  const complaint = await createComplaint(
    {
      text: "Fallen tree branch blocking two lanes near school crosswalk",
      category: "road_damage",
      location: { lat: 12.9750, lng: 77.5900 },
    },
    "citizen_for_resolution_test"
  );

  // 2. Officer assigns ticket
  const assignResult = await updateComplaint(
    complaint.id,
    {
      status: "assigned",
      assignedTo: "officer_sharma@civicflow.gov",
      note: "Dispatched road clearance team unit 4",
    },
    {
      uid: "officer_uid_101",
      role: "officer",
    }
  );

  assert.equal(assignResult.complaint.status, "assigned");
  assert.equal(assignResult.complaint.assignedTo, "officer_sharma@civicflow.gov");
  assert.equal(assignResult.event.from, "submitted");
  assert.equal(assignResult.event.to, "assigned");
  assert.equal(assignResult.event.actorRole, "officer");

  // 3. Officer resolves ticket with resolution notes
  const resolveResult = await updateComplaint(
    complaint.id,
    {
      status: "resolved",
      note: "Tree branch chopped and removed from roadway. Traffic flow restored.",
    },
    {
      uid: "officer_uid_101",
      role: "officer",
    }
  );

  assert.equal(resolveResult.complaint.status, "resolved");
  assert.equal(resolveResult.complaint.resolutionNotes, "Tree branch chopped and removed from roadway. Traffic flow restored.");
  assert.equal(resolveResult.event.from, "assigned");
  assert.equal(resolveResult.event.to, "resolved");

  // 4. Verify audit trail in status_events
  const events = await getStatusEvents(complaint.id);
  assert.ok(events.length >= 2);
  const toStatuses = events.map((e) => e.to);
  assert.ok(toStatuses.includes("assigned"));
  assert.ok(toStatuses.includes("resolved"));

  // 5. Verify stats aggregation
  const stats = await getComplaintStats();
  assert.ok(stats.total > 0);
  assert.ok(stats.resolved >= 1);
  assert.ok(stats.byCategory["road_damage"] >= 1);
});
