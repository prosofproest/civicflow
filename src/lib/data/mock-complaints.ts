/**
 * CivicFlow Synthetic Demonstration Dataset
 * 
 * Contains 45 realistically modeled civic reports situated within the Astra Metropolitan District.
 * 
 * Key Characteristics (Hackathon Requirements):
 * 1. Categorical Coverage: All 8 categories represented.
 * 2. Three Distinct Duplicate Groups:
 *    - Duplicate Group 1 (Water Main Burst, 10th Cross & 4th Main): rep_dup_1a, rep_dup_1b
 *    - Duplicate Group 2 (Severe Road Pothole, Market Road): rep_dup_2a, rep_dup_2b
 *    - Duplicate Group 3 (Dark Streetlight Junction, Park Avenue): rep_dup_3a, rep_dup_3b
 * 3. Four Urgent Safety Incidents (triggering the Safety Keyword Floor):
 *    - rep_urgent_1: Live wire sparking near primary school bus stop (MG Road)
 *    - rep_urgent_2: Strong gas leak odor detected near community center
 *    - rep_urgent_3: Open manhole cover missing on storm drainage culvert
 *    - rep_urgent_4: Deep sinkhole expanding rapidly on bridge approach ramp
 * 4. Spatial Hotspot Cluster:
 *    - Cluster of 7 reports within 250m radius around Astra Central Transit Hub (12.9716, 77.5946)
 * 5. Full Spectrum of Priority Levels: Critical, High, Medium, Low
 * 6. Diverse Municipal Statuses: submitted, under_review, assigned, in_progress, resolved
 * 7. Transparency: Every report is explicitly stamped with `isSynthetic: true`
 */

import { Complaint } from "@/types";

export const SYNTHETIC_COMPLAINTS: Complaint[] = [
  // =========================================================================
  // 1. URGENT SAFETY INCIDENTS (Triggering Safety Keyword Floor -> Critical)
  // =========================================================================
  {
    id: "rep_urgent_1",
    reporterUid: "demo_citizen_uid_123",
    text: "Dangerous live wire sparking from damaged utility pole near Primary School bus stop on 8th Cross. Children passing by.",
    category: "public_safety",
    aiCategory: "public_safety",
    summary: "Live wire sparking near school bus stop creating immediate electrocution hazard.",
    location: { lat: 12.9725, lng: 77.5950, address: "8th Cross, Near Primary School Gate" },
    status: "assigned",
    assignedTo: "BESCOM Dispatch Unit 4",
    priority: {
      score: 88,
      level: "critical",
      factors: [
        { key: "safety", label: "Public Safety", input: 95, weight: 0.35, contribution: 33.25 },
        { key: "urgency", label: "Response Urgency", input: 90, weight: 0.25, contribution: 22.5 },
        { key: "impact", label: "Community Impact", input: 85, weight: 0.25, contribution: 21.25 },
        { key: "related", label: "Related Reports", input: 75, weight: 0.15, contribution: 11.25 },
      ],
      explanation: "Priority score calculated as 88/100 (CRITICAL). [SAFETY FLOOR ENFORCED: Critical hazard keyword 'live wire' detected]. Immediate risk to school pedestrians.",
    },
    duplicate: { reasons: ["No prior unresolved duplicates detected."] },
    clusterId: "hotspot_cluster_1",
    relatedCount: 3,
    aiMeta: { status: "ok", model: "llama-3.3-70b-versatile" },
    isSynthetic: true,
    createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "rep_urgent_2",
    reporterUid: "synthetic_citizen_02",
    text: "Heavy gas leak smell venting from underground main pipe line near the central vegetable market. Pedestrians feeling dizzy.",
    category: "public_safety",
    aiCategory: "public_safety",
    summary: "Underground gas leak detected in high-density vegetable market sector.",
    location: { lat: 12.9712, lng: 77.5940, address: "Astra Central Market, North Gate" },
    status: "in_progress",
    assignedTo: "City Gas Emergency Crew",
    priority: {
      score: 91,
      level: "critical",
      factors: [
        { key: "safety", label: "Public Safety", input: 98, weight: 0.35, contribution: 34.3 },
        { key: "urgency", label: "Response Urgency", input: 95, weight: 0.25, contribution: 23.75 },
        { key: "impact", label: "Community Impact", input: 90, weight: 0.25, contribution: 22.5 },
        { key: "related", label: "Related Reports", input: 70, weight: 0.15, contribution: 10.5 },
      ],
      explanation: "Priority score calculated as 91/100 (CRITICAL). [SAFETY FLOOR ENFORCED: Critical hazard keyword 'gas leak' detected]. Evacuation zone established.",
    },
    duplicate: { reasons: ["Initial incident report filed."] },
    clusterId: "hotspot_cluster_1",
    relatedCount: 2,
    aiMeta: { status: "ok", model: "llama-3.3-70b-versatile" },
    isSynthetic: true,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "rep_urgent_3",
    reporterUid: "synthetic_citizen_03",
    text: "Open manhole cover completely missing on cycle pathway along Lake Road after heavy rain. Total dark spot at night.",
    category: "drainage",
    aiCategory: "public_safety",
    summary: "Uncovered deep manhole on pedestrian/cyclist path creating fall hazard.",
    location: { lat: 12.9680, lng: 77.5920, address: "Lake Promenade, Near Pier 3" },
    status: "under_review",
    priority: {
      score: 82,
      level: "critical",
      factors: [
        { key: "safety", label: "Public Safety", input: 88, weight: 0.35, contribution: 30.8 },
        { key: "urgency", label: "Response Urgency", input: 80, weight: 0.25, contribution: 20.0 },
        { key: "impact", label: "Community Impact", input: 75, weight: 0.25, contribution: 18.75 },
        { key: "related", label: "Related Reports", input: 80, weight: 0.15, contribution: 12.0 },
      ],
      explanation: "Priority score calculated as 82/100 (CRITICAL). [SAFETY FLOOR ENFORCED: Critical hazard keyword 'open manhole' detected].",
    },
    duplicate: { reasons: ["No duplicate candidate matches threshold."] },
    relatedCount: 3,
    aiMeta: { status: "ok", model: "llama-3.3-70b-versatile" },
    isSynthetic: true,
    createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: "rep_urgent_4",
    reporterUid: "synthetic_citizen_04",
    text: "Dangerous sinkhole opening on bridge approach ramp. Asphalt eroding rapidly into underlying canal.",
    category: "road_damage",
    aiCategory: "public_safety",
    summary: "Expanding sinkhole on structural bridge approach causing collapse risk.",
    location: { lat: 12.9750, lng: 77.5990, address: "Flyover North Ramp, Pillar 14" },
    status: "assigned",
    assignedTo: "Bridges & Highways Rapid Team",
    priority: {
      score: 89,
      level: "critical",
      factors: [
        { key: "safety", label: "Public Safety", input: 92, weight: 0.35, contribution: 32.2 },
        { key: "urgency", label: "Response Urgency", input: 90, weight: 0.25, contribution: 22.5 },
        { key: "impact", label: "Community Impact", input: 95, weight: 0.25, contribution: 23.75 },
        { key: "related", label: "Related Reports", input: 70, weight: 0.15, contribution: 10.5 },
      ],
      explanation: "Priority score calculated as 89/100 (CRITICAL). [SAFETY FLOOR ENFORCED: Critical hazard keyword 'sinkhole' detected]. Heavy vehicle detour required.",
    },
    duplicate: { reasons: ["Primary hazard notification."] },
    relatedCount: 2,
    aiMeta: { status: "ok", model: "llama-3.3-70b-versatile" },
    isSynthetic: true,
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
  },

  // =========================================================================
  // 2. DUPLICATE GROUP 1 (Water Main Burst at 10th Cross)
  // =========================================================================
  {
    id: "rep_dup_1a",
    reporterUid: "synthetic_citizen_05",
    text: "Water main pipe burst on 10th Cross arterial road. Fresh drinking water flooding the entire street intersection.",
    category: "water_supply",
    aiCategory: "water_supply",
    summary: "High volume drinking water pipe burst flooding 10th Cross intersection.",
    location: { lat: 12.9715, lng: 77.5945, address: "10th Cross & 4th Main Junction" },
    status: "in_progress",
    assignedTo: "Water Board Division 2",
    priority: {
      score: 72,
      level: "high",
      factors: [
        { key: "safety", label: "Public Safety", input: 60, weight: 0.35, contribution: 21.0 },
        { key: "urgency", label: "Response Urgency", input: 80, weight: 0.25, contribution: 20.0 },
        { key: "impact", label: "Community Impact", input: 85, weight: 0.25, contribution: 21.25 },
        { key: "related", label: "Related Reports", input: 65, weight: 0.15, contribution: 9.75 },
      ],
      explanation: "Priority score calculated as 72/100 (HIGH). Significant water loss impacting arterial traffic flow.",
    },
    duplicate: { reasons: ["Original citizen report on this water main rupture."] },
    clusterId: "hotspot_cluster_1",
    relatedCount: 2,
    aiMeta: { status: "ok", model: "llama-3.3-70b-versatile" },
    isSynthetic: true,
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "rep_dup_1b",
    reporterUid: "synthetic_citizen_06",
    text: "Drinking water pipe burst at 10th cross road. Massive water flooding in front of bakery shop.",
    category: "water_supply",
    aiCategory: "water_supply",
    summary: "Secondary notice of pipe rupture and road flooding on 10th cross.",
    location: { lat: 12.9717, lng: 77.5947, address: "10th Cross, Opp Royal Bakery" }, // ~31m away
    status: "under_review",
    priority: {
      score: 71,
      level: "high",
      factors: [
        { key: "safety", label: "Public Safety", input: 60, weight: 0.35, contribution: 21.0 },
        { key: "urgency", label: "Response Urgency", input: 80, weight: 0.25, contribution: 20.0 },
        { key: "impact", label: "Community Impact", input: 80, weight: 0.25, contribution: 20.0 },
        { key: "related", label: "Related Reports", input: 70, weight: 0.15, contribution: 10.5 },
      ],
      explanation: "Priority score calculated as 71/100 (HIGH). High overlap with nearby active report.",
    },
    duplicate: {
      ofId: "rep_dup_1a",
      score: 0.78,
      reasons: [
        "Potential duplicate of unresolved complaint #rep_dup_1a",
        "Geographic distance: 31.4m (within 150m threshold)",
        "Text lexical similarity (Jaccard): 68.2%",
        "Combined duplicate confidence score: 78.0% (threshold: 60.0%)",
      ],
    },
    clusterId: "hotspot_cluster_1",
    relatedCount: 2,
    aiMeta: { status: "ok", model: "llama-3.3-70b-versatile" },
    isSynthetic: true,
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },

  // =========================================================================
  // 3. DUPLICATE GROUP 2 (Severe Road Pothole, Market Road)
  // =========================================================================
  {
    id: "rep_dup_2a",
    reporterUid: "synthetic_citizen_07",
    text: "Deep crater pothole right in front of Commercial Street Market gate. Motorbikes skidding repeatedly.",
    category: "road_damage",
    aiCategory: "road_damage",
    summary: "Deep crater pothole outside market causing motorbike skidding incidents.",
    location: { lat: 12.9800, lng: 77.6050, address: "Commercial Street, Gate 1" },
    status: "assigned",
    assignedTo: "Road Maintenance Squad C",
    priority: {
      score: 64,
      level: "high",
      factors: [
        { key: "safety", label: "Public Safety", input: 70, weight: 0.35, contribution: 24.5 },
        { key: "urgency", label: "Response Urgency", input: 65, weight: 0.25, contribution: 16.25 },
        { key: "impact", label: "Community Impact", input: 60, weight: 0.25, contribution: 15.0 },
        { key: "related", label: "Related Reports", input: 50, weight: 0.15, contribution: 7.5 },
      ],
      explanation: "Priority score calculated as 64/100 (HIGH). Road hazard on busy retail transit route.",
    },
    duplicate: { reasons: ["Initial road distress report."] },
    relatedCount: 2,
    aiMeta: { status: "ok", model: "llama-3.3-70b-versatile" },
    isSynthetic: true,
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
  },
  {
    id: "rep_dup_2b",
    reporterUid: "synthetic_citizen_08",
    text: "Large deep crater pothole near Commercial Street Market entrance. Extremely risky for two wheelers.",
    category: "road_damage",
    aiCategory: "road_damage",
    summary: "Corroborating report on deep crater pothole at Commercial Street entrance.",
    location: { lat: 12.9803, lng: 77.6051, address: "Commercial Street, Near Entrance" }, // ~35m away
    status: "submitted",
    priority: {
      score: 65,
      level: "high",
      factors: [
        { key: "safety", label: "Public Safety", input: 70, weight: 0.35, contribution: 24.5 },
        { key: "urgency", label: "Response Urgency", input: 65, weight: 0.25, contribution: 16.25 },
        { key: "impact", label: "Community Impact", input: 65, weight: 0.25, contribution: 16.25 },
        { key: "related", label: "Related Reports", input: 50, weight: 0.15, contribution: 7.5 },
      ],
      explanation: "Priority score calculated as 65/100 (HIGH). Flagged as duplicate candidate of #rep_dup_2a.",
    },
    duplicate: {
      ofId: "rep_dup_2a",
      score: 0.74,
      reasons: [
        "Potential duplicate of unresolved complaint #rep_dup_2a",
        "Geographic distance: 34.8m (within 150m threshold)",
        "Text lexical similarity (Jaccard): 61.5%",
        "Combined duplicate confidence score: 74.0% (threshold: 60.0%)",
      ],
    },
    relatedCount: 2,
    aiMeta: { status: "ok", model: "llama-3.3-70b-versatile" },
    isSynthetic: true,
    createdAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
  },

  // =========================================================================
  // 4. DUPLICATE GROUP 3 (Dark Streetlight Junction, Park Avenue)
  // =========================================================================
  {
    id: "rep_dup_3a",
    reporterUid: "synthetic_citizen_09",
    text: "Four consecutive streetlights completely dead along Park Avenue corridor. Extremely pitch black for women commuters.",
    category: "streetlight",
    aiCategory: "streetlight",
    summary: "Multiple consecutive streetlights inactive on Park Avenue transit corridor.",
    location: { lat: 12.9650, lng: 77.6000, address: "Park Avenue, South Stretch" },
    status: "assigned",
    assignedTo: "Electrical Works Dept",
    priority: {
      score: 56,
      level: "high",
      factors: [
        { key: "safety", label: "Public Safety", input: 65, weight: 0.35, contribution: 22.75 },
        { key: "urgency", label: "Response Urgency", input: 55, weight: 0.25, contribution: 13.75 },
        { key: "impact", label: "Community Impact", input: 50, weight: 0.25, contribution: 12.5 },
        { key: "related", label: "Related Reports", input: 50, weight: 0.15, contribution: 7.5 },
      ],
      explanation: "Priority score calculated as 56/100 (HIGH). Public safety lighting failure in residential zone.",
    },
    duplicate: { reasons: ["Initial lighting outage ticket."] },
    relatedCount: 2,
    aiMeta: { status: "ok", model: "llama-3.3-70b-versatile" },
    isSynthetic: true,
    createdAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
  },
  {
    id: "rep_dup_3b",
    reporterUid: "synthetic_citizen_10",
    text: "Streetlights not working on Park Avenue corridor. Area is totally pitch black and dangerous.",
    category: "streetlight",
    aiCategory: "streetlight",
    summary: "Corroborating report on darkened street lighting on Park Avenue.",
    location: { lat: 12.9653, lng: 77.6002, address: "Park Avenue, Near Sector 4 Cross" }, // ~38m away
    status: "submitted",
    priority: {
      score: 55,
      level: "high",
      factors: [
        { key: "safety", label: "Public Safety", input: 65, weight: 0.35, contribution: 22.75 },
        { key: "urgency", label: "Response Urgency", input: 50, weight: 0.25, contribution: 12.5 },
        { key: "impact", label: "Community Impact", input: 50, weight: 0.25, contribution: 12.5 },
        { key: "related", label: "Related Reports", input: 50, weight: 0.15, contribution: 7.5 },
      ],
      explanation: "Priority score calculated as 55/100 (HIGH). Verified proximity match to ticket #rep_dup_3a.",
    },
    duplicate: {
      ofId: "rep_dup_3a",
      score: 0.71,
      reasons: [
        "Potential duplicate of unresolved complaint #rep_dup_3a",
        "Geographic distance: 38.2m (within 150m threshold)",
        "Text lexical similarity (Jaccard): 58.3%",
        "Combined duplicate confidence score: 71.0% (threshold: 60.0%)",
      ],
    },
    relatedCount: 2,
    aiMeta: { status: "ok", model: "llama-3.3-70b-versatile" },
    isSynthetic: true,
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
  },

  // =========================================================================
  // 5. GEOGRAPHIC HOTSPOT CLUSTER (7 reports within 250m around Transit Hub)
  // [Note: rep_urgent_1, rep_urgent_2, rep_dup_1a, rep_dup_1b also near transit hub]
  // Adding specific cluster members:
  // =========================================================================
  {
    id: "rep_cluster_01",
    reporterUid: "synthetic_citizen_11",
    text: "Stormwater drain blocked by construction silt outside Metro station entrance. Knee deep water on walkway.",
    category: "waterlogging",
    aiCategory: "waterlogging",
    summary: "Severe waterlogging at Central Metro station due to silt-blocked stormwater culvert.",
    location: { lat: 12.9718, lng: 77.5946, address: "Central Metro Terminal Gate 1" },
    status: "in_progress",
    assignedTo: "Stormwater Triage Team",
    priority: {
      score: 68,
      level: "high",
      factors: [
        { key: "safety", label: "Public Safety", input: 65, weight: 0.35, contribution: 22.75 },
        { key: "urgency", label: "Response Urgency", input: 70, weight: 0.25, contribution: 17.5 },
        { key: "impact", label: "Community Impact", input: 75, weight: 0.25, contribution: 18.75 },
        { key: "related", label: "Related Reports", input: 60, weight: 0.15, contribution: 9.0 },
      ],
      explanation: "Priority score calculated as 68/100 (HIGH). Heavy commuter transit blockage.",
    },
    duplicate: { reasons: ["Distinct drainage issue at Gate 1."] },
    clusterId: "hotspot_cluster_1",
    relatedCount: 4,
    aiMeta: { status: "ok", model: "llama-3.3-70b-versatile" },
    isSynthetic: true,
    createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: "rep_cluster_02",
    reporterUid: "synthetic_citizen_12",
    text: "Massive illegal garbage dumping mound behind Central Bus Interchange. Stinking foul odor attracting stray animals.",
    category: "waste",
    aiCategory: "waste",
    summary: "Large illegal garbage dump behind Central Bus Interchange creating sanitation risk.",
    location: { lat: 12.9714, lng: 77.5948, address: "Behind Platform 8, Central Bus Terminal" },
    status: "under_review",
    priority: {
      score: 48,
      level: "medium",
      factors: [
        { key: "safety", label: "Public Safety", input: 40, weight: 0.35, contribution: 14.0 },
        { key: "urgency", label: "Response Urgency", input: 45, weight: 0.25, contribution: 11.25 },
        { key: "impact", label: "Community Impact", input: 60, weight: 0.25, contribution: 15.0 },
        { key: "related", label: "Related Reports", input: 50, weight: 0.15, contribution: 7.5 },
      ],
      explanation: "Priority score calculated as 48/100 (MEDIUM). Sanitation remediation required.",
    },
    duplicate: { reasons: ["No duplicate complaints matching threshold."] },
    clusterId: "hotspot_cluster_1",
    relatedCount: 3,
    aiMeta: { status: "ok", model: "llama-3.3-70b-versatile" },
    isSynthetic: true,
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "rep_cluster_03",
    reporterUid: "synthetic_citizen_13",
    text: "Pedestrian sidewalk paving slabs broken and missing near Metro ticketing counter. Stumbling hazard for visually impaired.",
    category: "road_damage",
    aiCategory: "road_damage",
    summary: "Broken sidewalk tiles at Central Metro concourse posing trip hazard.",
    location: { lat: 12.9720, lng: 77.5944, address: "Metro Concourse South Walkway" },
    status: "submitted",
    priority: {
      score: 42,
      level: "medium",
      factors: [
        { key: "safety", label: "Public Safety", input: 45, weight: 0.35, contribution: 15.75 },
        { key: "urgency", label: "Response Urgency", input: 35, weight: 0.25, contribution: 8.75 },
        { key: "impact", label: "Community Impact", input: 50, weight: 0.25, contribution: 12.5 },
        { key: "related", label: "Related Reports", input: 30, weight: 0.15, contribution: 4.5 },
      ],
      explanation: "Priority score calculated as 42/100 (MEDIUM). Pedestrian safety improvement ticket.",
    },
    duplicate: { reasons: ["Unique walkway defect."] },
    clusterId: "hotspot_cluster_1",
    relatedCount: 2,
    aiMeta: { status: "ok", model: "llama-3.3-70b-versatile" },
    isSynthetic: true,
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
  },

  // =========================================================================
  // 6. SPREAD ACROSS ALL REMAINING CATEGORIES & PRIORITY TIERS (Reports 14-45)
  // =========================================================================
  {
    id: "rep_cat_01",
    reporterUid: "synthetic_citizen_14",
    text: "Sewage overflow from municipal line into apartment compound basement on Residency Road.",
    category: "drainage",
    aiCategory: "drainage",
    summary: "Municipal sewage backing up into residential basement.",
    location: { lat: 12.9690, lng: 77.6010, address: "Residency Road, Block C" },
    status: "in_progress",
    assignedTo: "Sanitation Rapid Response",
    priority: {
      score: 74,
      level: "high",
      factors: [
        { key: "safety", label: "Public Safety", input: 75, weight: 0.35, contribution: 26.25 },
        { key: "urgency", label: "Response Urgency", input: 75, weight: 0.25, contribution: 18.75 },
        { key: "impact", label: "Community Impact", input: 75, weight: 0.25, contribution: 18.75 },
        { key: "related", label: "Related Reports", input: 70, weight: 0.15, contribution: 10.5 },
      ],
      explanation: "Priority score calculated as 74/100 (HIGH). Biological contamination hazard inside building premises.",
    },
    duplicate: { reasons: ["Independent residential sewage backup."] },
    relatedCount: 3,
    aiMeta: { status: "ok", model: "llama-3.3-70b-versatile" },
    isSynthetic: true,
    createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: "rep_cat_02",
    reporterUid: "synthetic_citizen_15",
    text: "Water supply brown and smelling foul in Victoria Layout residential taps for past two days.",
    category: "water_supply",
    aiCategory: "water_supply",
    summary: "Contaminated brown drinking water reported in residential pipelines.",
    location: { lat: 12.9620, lng: 77.6080, address: "Victoria Layout, 3rd Cross" },
    status: "assigned",
    assignedTo: "Water Quality Testing Wing",
    priority: {
      score: 70,
      level: "high",
      factors: [
        { key: "safety", label: "Public Safety", input: 70, weight: 0.35, contribution: 24.5 },
        { key: "urgency", label: "Response Urgency", input: 70, weight: 0.25, contribution: 17.5 },
        { key: "impact", label: "Community Impact", input: 75, weight: 0.25, contribution: 18.75 },
        { key: "related", label: "Related Reports", input: 60, weight: 0.15, contribution: 9.0 },
      ],
      explanation: "Priority score calculated as 70/100 (HIGH). Public health advisory and water line flush required.",
    },
    duplicate: { reasons: ["Water line test scheduled."] },
    relatedCount: 4,
    aiMeta: { status: "ok", model: "llama-3.3-70b-versatile" },
    isSynthetic: true,
    createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "rep_cat_03",
    reporterUid: "synthetic_citizen_16",
    text: "Waste segregation bin overturned by dogs on Queen's Road park edge. Plastic litter scattered across lawn.",
    category: "waste",
    aiCategory: "waste",
    summary: "Overturned public bin scattering plastic litter along park perimeter.",
    location: { lat: 12.9830, lng: 77.5970, address: "Queen's Park West Edge" },
    status: "resolved",
    assignedTo: "Civic Sanitation Crew 1",
    priority: {
      score: 28,
      level: "low",
      factors: [
        { key: "safety", label: "Public Safety", input: 20, weight: 0.35, contribution: 7.0 },
        { key: "urgency", label: "Response Urgency", input: 30, weight: 0.25, contribution: 7.5 },
        { key: "impact", label: "Community Impact", input: 35, weight: 0.25, contribution: 8.75 },
        { key: "related", label: "Related Reports", input: 30, weight: 0.15, contribution: 4.5 },
      ],
      explanation: "Priority score calculated as 28/100 (LOW). Routine municipal groundskeeping cleanup.",
    },
    duplicate: { reasons: ["No duplicate tickets."] },
    relatedCount: 1,
    aiMeta: { status: "ok", model: "llama-3.3-70b-versatile" },
    isSynthetic: true,
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "rep_cat_04",
    reporterUid: "synthetic_citizen_17",
    text: "Faded pedestrian crosswalk markings outside Government Girls College causing speeding vehicles to ignore crossings.",
    category: "other",
    aiCategory: "road_damage",
    summary: "Illegible zebra crossing outside college reducing pedestrian crossing safety.",
    location: { lat: 12.9770, lng: 77.5910, address: "College Road, Near Main Gate" },
    status: "under_review",
    priority: {
      score: 46,
      level: "medium",
      factors: [
        { key: "safety", label: "Public Safety", input: 55, weight: 0.35, contribution: 19.25 },
        { key: "urgency", label: "Response Urgency", input: 40, weight: 0.25, contribution: 10.0 },
        { key: "impact", label: "Community Impact", input: 50, weight: 0.25, contribution: 12.5 },
        { key: "related", label: "Related Reports", input: 30, weight: 0.15, contribution: 4.5 },
      ],
      explanation: "Priority score calculated as 46/100 (MEDIUM). Traffic signage and repainting maintenance queue.",
    },
    duplicate: { reasons: ["Traffic markings maintenance."] },
    relatedCount: 2,
    aiMeta: { status: "ok", model: "llama-3.3-70b-versatile" },
    isSynthetic: true,
    createdAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(),
  },

  // Generated remaining synthetic entries (18-45) spanning diverse categories & statuses
  ...Array.from({ length: 28 }, (_, idx): Complaint => {
    const num = idx + 18;
    const categories: Array<Complaint["category"]> = [
      "waterlogging",
      "road_damage",
      "waste",
      "streetlight",
      "drainage",
      "water_supply",
      "public_safety",
      "other",
    ];
    const cat = categories[idx % categories.length];
    const statuses: Array<Complaint["status"]> = [
      "submitted",
      "under_review",
      "assigned",
      "in_progress",
      "resolved",
    ];
    const status = statuses[idx % statuses.length];
    const baseLat = 12.9716 + (Math.sin(num) * 0.025);
    const baseLng = 77.5946 + (Math.cos(num) * 0.025);

    const scores = [32, 44, 52, 58, 62, 73, 76][idx % 7];
    const level: Complaint["priority"]["level"] =
      scores >= 75 ? "critical" : scores >= 55 ? "high" : scores >= 35 ? "medium" : "low";

    const daysAgo = (idx % 14) + 1;

    return {
      id: `rep_synth_${num}`,
      reporterUid: `synthetic_citizen_${(num % 10) + 1}`,
      text: `Municipal report regarding ${cat.replace(/_/g, " ")} issue in Zone ${(idx % 5) + 1}. Observed recurring disturbance to local residents and traffic flow.`,
      category: cat,
      aiCategory: cat,
      summary: `Synthetic civic incident report addressing ${cat.replace(/_/g, " ")} in municipal district sector ${(idx % 5) + 1}.`,
      location: {
        lat: Number(baseLat.toFixed(5)),
        lng: Number(baseLng.toFixed(5)),
        address: `Sector ${(idx % 5) + 1}, Block ${String.fromCharCode(65 + (idx % 6))}`,
      },
      status,
      assignedTo: status === "assigned" || status === "in_progress" ? `Municipal Field Team ${(idx % 4) + 1}` : undefined,
      priority: {
        score: scores,
        level,
        factors: [
          { key: "safety", label: "Public Safety", input: Math.min(100, scores + 5), weight: 0.35, contribution: Number(((Math.min(100, scores + 5)) * 0.35).toFixed(2)) },
          { key: "urgency", label: "Response Urgency", input: scores, weight: 0.25, contribution: Number((scores * 0.25).toFixed(2)) },
          { key: "impact", label: "Community Impact", input: Math.max(0, scores - 5), weight: 0.25, contribution: Number(((Math.max(0, scores - 5)) * 0.25).toFixed(2)) },
          { key: "related", label: "Related Reports", input: (idx % 4) * 25, weight: 0.15, contribution: Number((((idx % 4) * 25) * 0.15).toFixed(2)) },
        ],
        explanation: `Priority score calculated as ${scores}/100 (${level.toUpperCase()}). Deterministic factor synthesis for civic triage.`,
      },
      duplicate: { reasons: ["Synthetic dataset reference."] },
      relatedCount: idx % 4,
      aiMeta: { status: "ok" as const, model: "llama-3.3-70b-versatile" },
      isSynthetic: true,
      createdAt: new Date(Date.now() - daysAgo * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - (daysAgo - 1) * 24 * 3600 * 1000).toISOString(),
    };
  }),
];
