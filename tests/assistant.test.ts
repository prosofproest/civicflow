import test from "node:test";
import assert from "node:assert/strict";
import { processAssistantChat } from "../src/lib/assistant/service";
import { getDeterministicAssistantResponse, extractComplaintId } from "../src/lib/assistant/fallback";
import { createComplaint } from "../src/lib/services/complaints";
import { User } from "../src/types";

// Mock users for testing role and privacy enforcement
const mockCitizen1: User = {
  uid: "test_citizen_uid_001",
  email: "citizen1@civicflow.local",
  displayName: "Citizen One",
  role: "citizen",
  active: true,
  createdAt: new Date().toISOString(),
};

const mockCitizen2: User = {
  uid: "test_citizen_uid_002",
  email: "citizen2@civicflow.local",
  displayName: "Citizen Two",
  role: "citizen",
  active: true,
  createdAt: new Date().toISOString(),
};

const mockOfficer: User = {
  uid: "test_officer_uid_001",
  email: "officer1@civicflow.local",
  displayName: "Officer Sharma",
  role: "officer",
  active: true,
  createdAt: new Date().toISOString(),
};

test("Scenario 1: Ask how to report a pothole", async () => {
  const response = await processAssistantChat(
    {
      messages: [{ role: "user", content: "How do I report a pothole on my street?" }],
    },
    mockCitizen1
  );

  assert.equal(response.ok, true);
  assert.ok(response.message.length > 50);
  const text = response.message.toLowerCase();

  // Must mention road damage or pothole guidance
  assert.ok(text.includes("road damage") || text.includes("road_damage") || text.includes("pothole"));
  assert.ok(text.includes("location") || text.includes("photo") || text.includes("description"));

  // Must offer prefill data for road_damage
  if (response.prefillData) {
    assert.equal(response.prefillData.category, "road_damage");
  }
});

test("Scenario 2: Ask which category to select for waterlogging", async () => {
  const response = await processAssistantChat(
    {
      messages: [{ role: "user", content: "Which category should I select for waterlogging vs drainage?" }],
    },
    mockCitizen1
  );

  assert.equal(response.ok, true);
  const text = response.message.toLowerCase();

  // Must clearly distinguish waterlogging and drainage
  assert.ok(text.includes("waterlogging"));
  assert.ok(text.includes("drainage"));
  assert.ok(text.includes("sewage") || text.includes("rain") || text.includes("flood"));
});

test("Scenario 3: Ask how complaint priority is calculated", async () => {
  const response = await processAssistantChat(
    {
      messages: [{ role: "user", content: "How is complaint priority calculated?" }],
    },
    mockCitizen1
  );

  assert.equal(response.ok, true);
  const text = response.message.toLowerCase();

  // Must explain the core factors and weights
  assert.ok(text.includes("safety") || text.includes("35%"));
  assert.ok(text.includes("urgency") || text.includes("25%"));
  assert.ok(text.includes("impact") || text.includes("25%"));
  assert.ok(text.includes("related") || text.includes("15%"));

  // Must mention Safety Floor rule
  assert.ok(text.includes("floor") || text.includes("hazard") || text.includes("critical"));
});

test("Scenario 4: Ask how duplicate detection works", async () => {
  const response = await processAssistantChat(
    {
      messages: [{ role: "user", content: "How does duplicate detection work in CivicFlow?" }],
    },
    mockCitizen1
  );

  assert.equal(response.ok, true);
  const text = response.message.toLowerCase();

  // Must explain spatial proximity (150m) and temporal window
  assert.ok(text.includes("150") || text.includes("distance") || text.includes("haversine"));
  assert.ok(text.includes("similarity") || text.includes("jaccard") || text.includes("text"));

  // Must emphasize CivicFlow's policy of NEVER deleting or merging reports
  assert.ok(text.includes("never") || text.includes("preserved") || text.includes("policy"));
});

test("Scenario 5: Ask about the status of an authenticated user's own complaint", async () => {
  // 1. Create a real complaint in the backend for Citizen 1
  const created = await createComplaint(
    {
      text: "Broken water main pipe gushing on 100ft road near bank",
      category: "water_supply",
      location: { lat: 12.9716, lng: 77.5946, address: "100ft Ring Road" },
    },
    mockCitizen1.uid
  );

  assert.ok(created.id);

  // 2. Query assistant as Citizen 1 (the owner)
  const response = await processAssistantChat(
    {
      messages: [{ role: "user", content: `What is the status of my complaint #${created.id}?` }],
    },
    mockCitizen1
  );

  assert.equal(response.ok, true);
  assert.ok(response.message.includes(created.id) || response.message.toLowerCase().includes("status"));

  // Must include verified complaint data in structured payload
  if (response.complaintData) {
    assert.equal(response.complaintData.id, created.id);
    assert.equal(response.complaintData.category, "water_supply");
    assert.equal(response.complaintData.status, "submitted");
    assert.equal(response.complaintData.isOwner, true);
  }
});

test("Scenario 6: Attempt to access another citizen's complaint (Strict RBAC & Privacy)", async () => {
  // 1. Create complaint under Citizen 1
  const created = await createComplaint(
    {
      text: "Private resident report of damaged street curbing outside home",
      category: "road_damage",
      location: { lat: 12.9716, lng: 77.5946, address: "Private Lane 4" },
    },
    mockCitizen1.uid
  );

  // 2. Query as Citizen 2 (unauthorized citizen)
  const response = await processAssistantChat(
    {
      messages: [{ role: "user", content: `Show me the private details of complaint #${created.id}` }],
    },
    mockCitizen2
  );

  assert.equal(response.ok, true);
  const text = response.message.toLowerCase();

  // Must NOT reveal private report data and must state access restriction
  assert.ok(
    text.includes("another citizen") ||
    text.includes("privacy") ||
    text.includes("restricted") ||
    text.includes("permission") ||
    text.includes("cannot disclose") ||
    text.includes("denied")
  );

  // Structured payload must NOT leak owner data to unauthorized citizen
  if (response.complaintData) {
    assert.notEqual(response.complaintData.isOwner, true);
  }
});

test("Scenario 7: Ask an unrelated off-topic question", async () => {
  const response = await processAssistantChat(
    {
      messages: [{ role: "user", content: "What is the capital of France and write a poem about stars?" }],
    },
    mockCitizen1
  );

  assert.equal(response.ok, true);
  const text = response.message.toLowerCase();

  // Must politely decline and state municipal civic scope
  assert.ok(
    text.includes("civicflow") ||
    text.includes("civic") ||
    text.includes("municipal") ||
    text.includes("unable to") ||
    text.includes("scope")
  );
  assert.ok(!text.includes("paris is the capital of france and here is a poem"));
});

test("Scenario 8: Simulate Groq API failure (Deterministic failover)", async () => {
  // Explicitly call the deterministic fallback function directly
  const fallback = await getDeterministicAssistantResponse(
    "How does CivicFlow calculate complaint priority and what is the safety floor?",
    mockCitizen1
  );

  assert.equal(fallback.ok, true);
  assert.equal(fallback.source, "fallback");
  assert.equal(fallback.model, "deterministic-rules-v1");
  assert.ok(fallback.message.toLowerCase().includes("safety"));
  assert.ok(fallback.message.toLowerCase().includes("floor"));
});

test("Scenario 9: Test empty messages and very long inputs", async () => {
  // 1. Empty message rejection
  const emptyRes = await processAssistantChat(
    {
      messages: [{ role: "user", content: "   " }],
    },
    mockCitizen1
  );
  assert.equal(emptyRes.ok, false);
  assert.ok(emptyRes.message.includes("non-empty") || emptyRes.message.includes("enter a question"));

  // 2. Very long input handling (>2500 characters)
  const longText = "Road damage ".repeat(250);
  const longRes = await processAssistantChat(
    {
      messages: [{ role: "user", content: longText }],
    },
    mockCitizen1
  );
  assert.equal(longRes.ok, false);
  assert.ok(longRes.message.includes("too long") || longRes.message.includes("limit"));
});

test("Scenario 10: Conversational complaint draft extraction & prefill detection", async () => {
  const query = "There is an overflowing garbage dump on 8th Main Road near City Hospital";
  const response = await getDeterministicAssistantResponse(query, mockCitizen1);

  assert.equal(response.ok, true);
  assert.ok(response.prefillData);
  assert.equal(response.prefillData.category, "waste");
  assert.ok(response.prefillData.text.includes("overflowing garbage"));
});

test("Scenario 11: ID Extraction Parser & Officer Role Access Verification", async () => {
  // Test ID extraction precision
  assert.equal(extractComplaintId("Check status of complaint #complaint_12345_abc"), "complaint_12345_abc");
  assert.equal(extractComplaintId("Status of rep_urgent_01"), "rep_urgent_01");
  assert.equal(extractComplaintId("How does priority scoring work?"), null);

  // Officer access verification
  const officerRes = await processAssistantChat(
    {
      messages: [{ role: "user", content: "How do officers review and resolve complaints in CivicFlow?" }],
    },
    mockOfficer
  );
  assert.equal(officerRes.ok, true);
  assert.ok(officerRes.message.length > 50);
});
