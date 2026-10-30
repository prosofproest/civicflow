import test from "node:test";
import assert from "node:assert/strict";
import { getServerSessionUser, CookieStoreLike } from "../src/lib/auth/server-session";
import {
  createComplaint,
  getComplaints,
  updateComplaint,
  getComplaintStats,
  getComplaintById,
} from "../src/lib/services/complaints";

class MockCookieStore implements CookieStoreLike {
  private cookies = new Map<string, string>();

  constructor(initial: Record<string, string> = {}) {
    for (const [k, v] of Object.entries(initial)) {
      this.cookies.set(k, v);
    }
  }

  get(name: string): { value: string } | undefined {
    const val = this.cookies.get(name);
    return val !== undefined ? { value: val } : undefined;
  }

  set(name: string, value: string) {
    this.cookies.set(name, value);
  }

  delete(name: string) {
    this.cookies.delete(name);
  }
}

test("Demo Session: resolves correct identity for Citizen, Officer, and Admin", async () => {
  const store = new MockCookieStore({
    civicflow_mode: "demo",
    civicflow_demo_session: "demo_sess_123456",
    civicflow_demo_role: "citizen",
    civicflow_session: "demo_token_demo_sess_123456",
    civicflow_role: "citizen",
  });

  // 1. Citizen Role
  const citizenSession = await getServerSessionUser(store);
  assert.equal(citizenSession.isDemo, true);
  assert.equal(citizenSession.user?.role, "citizen");
  assert.equal(citizenSession.user?.displayName, "Demo Citizen");
  assert.equal(citizenSession.user?.email, "citizen@civicflow.local");
  assert.equal(citizenSession.user?.uid, "demo_citizen_uid_123");

  // 2. Switch to Officer
  store.set("civicflow_demo_role", "officer");
  store.set("civicflow_role", "officer");
  const officerSession = await getServerSessionUser(store);
  assert.equal(officerSession.isDemo, true);
  assert.equal(officerSession.user?.role, "officer");
  assert.equal(officerSession.user?.displayName, "Demo Officer");
  assert.equal(officerSession.user?.email, "officer@civicflow.local");

  // 3. Switch to Admin
  store.set("civicflow_demo_role", "admin");
  store.set("civicflow_role", "admin");
  const adminSession = await getServerSessionUser(store);
  assert.equal(adminSession.isDemo, true);
  assert.equal(adminSession.user?.role, "admin");
  assert.equal(adminSession.user?.displayName, "Demo Administrator");
  assert.equal(adminSession.user?.email, "admin@civicflow.local");
});

test("Demo Session: safely defaults invalid role to citizen", async () => {
  const store = new MockCookieStore({
    civicflow_mode: "demo",
    civicflow_demo_session: "demo_sess_999",
    civicflow_demo_role: "superadmin_hacker",
  });

  const session = await getServerSessionUser(store);
  assert.equal(session.isDemo, true);
  assert.equal(session.user?.role, "citizen");
  assert.equal(session.user?.displayName, "Demo Citizen");
});

test("Real RBAC Security: client-provided role cookie cannot escalate real session", async () => {
  // If civicflow_mode is not demo and session is not demo_, real verification occurs
  const store = new MockCookieStore({
    civicflow_session: "real_firebase_token_xyz",
    civicflow_role: "admin", // Client attempt to forge admin
    civicflow_demo_role: "admin",
  });

  const session = await getServerSessionUser(store);
  // Real token verification fails or verifies against Firestore, never blindly trusting client role
  assert.notEqual(session.user?.role, "admin");
});

test("Demo Workflow & Data Continuity: Citizen -> Officer -> Admin -> Citizen", async () => {
  const citizenUid = "demo_citizen_uid_123";

  // Step 1: Demo Citizen creates a new complaint
  const complaint = await createComplaint(
    {
      text: "Massive pothole on 5th Main causing vehicle rim damage",
      category: "road_damage",
      location: { lat: 12.9755, lng: 77.5960, address: "5th Main Astra Hub" },
    },
    citizenUid,
    { isDemo: true }
  );

  assert.ok(complaint.id);
  assert.equal(complaint.reporterUid, citizenUid);
  assert.equal(complaint.status, "submitted");
  assert.equal(complaint.isSynthetic, true);

  // Step 2: Switch to Officer role - Officer sees the complaint in all complaints
  const allForOfficer = await getComplaints({ isDemo: true, limit: 150 });
  const foundByOfficer = allForOfficer.find((c) => c.id === complaint.id);
  assert.ok(foundByOfficer, "Officer must be able to view demo citizen complaint");

  // Step 3: Officer assigns and updates complaint status
  const updateResult = await updateComplaint(
    complaint.id,
    {
      status: "in_progress",
      assignedTo: "Demo Officer",
      note: "Field crew dispatched to fill pothole with quick-curing asphalt",
    },
    {
      uid: "demo_officer_uid_123",
      role: "officer",
    },
    { isDemo: true }
  );

  assert.equal(updateResult.complaint.status, "in_progress");
  assert.equal(updateResult.complaint.assignedTo, "Demo Officer");
  assert.equal(updateResult.event.to, "in_progress");

  // Step 4: Switch to Admin role - Admin inspects system stats
  const adminStats = await getComplaintStats({ isDemo: true });
  assert.ok(adminStats.total >= 46);
  assert.ok(adminStats.open >= 1);

  // Step 5: Switch back to Citizen role - Citizen views their complaints
  const citizenComplaints = await getComplaints({
    reporterUid: citizenUid,
    isDemo: true,
  });

  const citizenView = citizenComplaints.find((c) => c.id === complaint.id);
  assert.ok(citizenView, "Citizen must see their submitted complaint after role switching");
  assert.equal(citizenView.status, "in_progress", "Citizen must see the updated status from officer");
  assert.equal(citizenView.assignedTo, "Demo Officer");

  // Verify complaint details retrieval
  const directInspect = await getComplaintById(complaint.id, { isDemo: true });
  assert.equal(directInspect?.status, "in_progress");
  assert.equal(directInspect?.resolutionNotes, "Field crew dispatched to fill pothole with quick-curing asphalt");
});
