/**
 * CivicFlow Domain Knowledge Base for AI Assistant & Deterministic Fallback
 * Comprehensive reference for categories, platform stages, priority scoring,
 * duplicate detection rules, and role-based workflows.
 */

import { PRIORITY_THRESHOLDS, PRIORITY_WEIGHTS } from "@/lib/constants";
import { Category, Status } from "@/types";

export interface CategoryGuide {
  category: Category;
  title: string;
  description: string;
  whenToSelect: string;
  examples: string[];
  keyDifferences?: string;
}

export const CATEGORY_GUIDES: Record<Category, CategoryGuide> = {
  road_damage: {
    category: "road_damage",
    title: "Road Damage",
    description: "Physical defects in road surfaces, asphalt, pavements, or footpaths.",
    whenToSelect: "Select when you observe potholes, cracked asphalt, sinkholes in roads, sunken pavers, or uneven pavement dangerous to vehicles or pedestrians.",
    examples: [
      "Deep pothole on 100ft Ring Road causing traffic swerves",
      "Broken pavement tiles tripping pedestrians outside the market",
      "Crater on bridge approach ramp",
    ],
    keyDifferences: "If water has accumulated in a pothole during rains, prioritize 'waterlogging' if flooding is the main issue, or 'road_damage' if the physical crater is the primary structural risk.",
  },
  waterlogging: {
    category: "waterlogging",
    title: "Waterlogging",
    description: "Accumulation of rainwater or stagnant surface water on streets, intersections, and public paths.",
    whenToSelect: "Select when surface flooding or standing water impedes traffic, submerges roads, or threatens nearby homes.",
    examples: [
      "Road submerged under 1 foot of water after rain near underpass",
      "Stagnant pool of water blocking pedestrian sidewalk for 3 days",
      "Waterlogged junction causing severe vehicle stalling",
    ],
    keyDifferences: "Choose 'waterlogging' for flooded surface streets. If the root cause is an overflowing, smelly sewer drain or blocked culvert, select 'drainage'. If it is clean water gushing from a cracked pipe, select 'water_supply'.",
  },
  drainage: {
    category: "drainage",
    title: "Drainage & Sewage",
    description: "Clogged stormwater drains, overflowing manholes, blocked culverts, and sewage leaks.",
    whenToSelect: "Select when sewer water is overflowing, storm drains are blocked with silt/debris, or manholes are spilling wastewater.",
    examples: [
      "Sewage manhole overflowing on 4th Main Road with foul odor",
      "Stormwater drain choked with plastic debris preventing rainwater runoff",
      "Broken drain slab with exposed sewage channel",
    ],
    keyDifferences: "Drainage specifically covers subsurface sewage and storm channels. If clean drinking water is leaking, use 'water_supply'. If there is an open missing manhole cover posing a fall hazard, consider 'public_safety'.",
  },
  waste: {
    category: "waste",
    title: "Waste Management",
    description: "Uncollected garbage, overflowing public dumpsters, debris dumping, and litter in public areas.",
    whenToSelect: "Select when municipal bins are full, trash has been dumped on roadsides, or construction debris blocks sidewalks.",
    examples: [
      "Overflowing community garbage bin spilling onto the street",
      "Illegal dumping of construction rubble on empty public plot",
      "Uncollected organic waste rotting outside residential gate",
    ],
    keyDifferences: "For chemical or hazardous industrial spills that present immediate health toxicity, choose 'public_safety'.",
  },
  streetlight: {
    category: "streetlight",
    title: "Streetlight",
    description: "Malfunctioning street lamps, dark public corridors, flickering poles, or broken fixtures.",
    whenToSelect: "Select when streetlights are not turning on at night, stay on 24/7, flicker, or when lamp posts are tilted.",
    examples: [
      "Entire stretch of 5 streetlights dark on 8th Cross Road",
      "Streetlight fixture hanging precariously from pole",
      "Light flickering continuously for a week creating dark blindspot",
    ],
    keyDifferences: "If wires are sparked, severed, or sparking on the ground, immediately choose 'public_safety' instead.",
  },
  water_supply: {
    category: "water_supply",
    title: "Water Supply",
    description: "Issues with municipal potable water pipelines, supply pressure, quality, or pipe bursts.",
    whenToSelect: "Select when clean drinking water pipelines burst, no municipal water is delivered on schedule, or tap water is muddy.",
    examples: [
      "Drinking water main pipeline burst gushing thousands of liters",
      "No water supply to Ward 14 for 4 consecutive days",
      "Brown discolored tap water supplied from municipal line",
    ],
    keyDifferences: "Use 'water_supply' for clean municipal utility water. Use 'drainage' for sewage/wastewater.",
  },
  public_safety: {
    category: "public_safety",
    title: "Public Safety (Emergency Hazards)",
    description: "Immediate life-threatening or dangerous public hazards triggering emergency municipal response.",
    whenToSelect: "Select for live electric wires, open manholes, gas leaks, structural cracks/collapses, or explosion hazards.",
    examples: [
      "Downed live electric wire sparking on wet pavement",
      "Deep open manhole without cover on unlit street",
      "Retaining wall partially collapsed threatening footpath",
      "Strong gas odor leaking from underground commercial line",
    ],
    keyDifferences: "Public Safety reports automatically trigger the CivicFlow Safety Floor, locking the priority to Critical (score >= 75) to guarantee immediate dispatch.",
  },
  other: {
    category: "other",
    title: "Other Civic Issues",
    description: "Civic concerns that do not cleanly match the primary categories.",
    whenToSelect: "Select when reporting damaged park benches, illegal hoardings, unauthorized tree cutting, or non-hazardous civic infrastructure issues.",
    examples: [
      "Broken playground swing in public children's park",
      "Illegal commercial billboard blocking traffic signal visibility",
    ],
  },
};

export const CIVICFLOW_LIFECYCLE_STAGES = [
  {
    stage: "01",
    name: "Capture",
    title: "Multimodal Citizen Intake",
    description: "Frictionless reporting via structured web forms and mobile uploads. Integrates GPS geotagging, photo evidence, and intelligent category deduction.",
    features: [
      "GPS geotagging & precise map coordinates",
      "Visual evidence upload with cloud storage",
      "AI-assisted automatic category deduction",
      "Real-time immediate hazard warning detection",
    ],
  },
  {
    stage: "02",
    name: "Understand",
    title: "AI Deduplication & Priority Scoring",
    description: "Automated spatial clustering detects duplicate reports within 150m. Multi-factor algorithmic scoring evaluates safety, urgency, impact, and related citizen reports.",
    features: [
      "Token-based Jaccard text similarity + Haversine geographic proximity",
      "4-factor weighted priority score (Safety 35%, Urgency 25%, Impact 25%, Related 15%)",
      "Safety Keyword Floor: guarantees Critical priority (>=75) for life-threatening hazards",
      "Strict policy: never automatically deletes or merges complaints",
    ],
  },
  {
    stage: "03",
    name: "Reveal",
    title: "Transparent Municipal Visibility",
    description: "Live triage dashboards replace opaque complaint black holes. Field officers and administrators inspect spatial heatmaps, cluster maps, and audited status trails.",
    features: [
      "Interactive OpenStreetMap spatial visualization",
      "Density-based spatial hotspot clustering (250m threshold)",
      "Transparent factor-by-factor priority breakdowns",
      "Public and authenticated status tracking",
    ],
  },
  {
    stage: "04",
    name: "Act",
    title: "Coordinated Field Dispatch & Resolution",
    description: "Role-based workflows guide municipal officers from intake to closure. Every status transition records an immutable audit event.",
    features: [
      "Structured status progression: submitted → under_review → assigned → in_progress → resolved",
      "Officer assignment with contact tracking",
      "Resolution notes and completion verification",
      "Audited event timeline for full citizen accountability",
    ],
  },
];

export const STATUS_DESCRIPTIONS: Record<Status, { title: string; description: string; nextSteps: string }> = {
  submitted: {
    title: "Submitted",
    description: "Your complaint has been successfully recorded in CivicFlow and queued for initial departmental review.",
    nextSteps: "A municipal triage officer will review the report, verify the location, and evaluate the priority.",
  },
  under_review: {
    title: "Under Review",
    description: "Municipal engineers or dispatchers are actively examining your complaint and cross-referencing nearby reports.",
    nextSteps: "The issue will be assigned to a specific field officer or maintenance contractor.",
  },
  assigned: {
    title: "Assigned",
    description: "Your complaint has been assigned to a designated municipal officer or field response unit.",
    nextSteps: "The field unit is scheduled to deploy equipment and initiate remediation work.",
  },
  in_progress: {
    title: "In Progress",
    description: "Field crews are on-site or remediation work is actively underway.",
    nextSteps: "Work will proceed until the issue is fixed, followed by site inspection and resolution logging.",
  },
  resolved: {
    title: "Resolved",
    description: "The reported civic issue has been remedied and verified by the assigned officer with resolution notes.",
    nextSteps: "The complaint is closed. You can review the officer's resolution notes in your portal.",
  },
  rejected: {
    title: "Rejected",
    description: "The complaint could not be processed due to invalid details, out-of-jurisdiction location, or duplicate reference.",
    nextSteps: "Check the officer's review notes for specific reasoning. You may submit a corrected complaint if appropriate.",
  },
};

export const PRIORITY_ENGINE_DETAILS = {
  weights: PRIORITY_WEIGHTS,
  thresholds: PRIORITY_THRESHOLDS,
  formula: "Final Score = (Safety × 35%) + (Urgency × 25%) + (Impact × 25%) + (Related Reports × 15%)",
  factors: [
    {
      name: "Public Safety (35%)",
      description: "Immediate physical threat to human life or bodily harm (e.g. live wires, deep sinkholes, open manholes).",
    },
    {
      name: "Response Urgency (25%)",
      description: "Rate of degradation or time sensitivity (e.g. spreading sewage, worsening water main leak).",
    },
    {
      name: "Community Impact (25%)",
      description: "Scale of citizen disruption (e.g. arterial road blockage, proximity to schools or hospitals).",
    },
    {
      name: "Related Reports (15%)",
      description: "Crowdsourced confirmation from multiple citizens (0 reports = 0%, 1 = 25%, 2 = 50%, 3 = 75%, 4+ = 100%).",
    },
  ],
  safetyFloor: {
    rule: "Immediate Hazard Safety Floor",
    description: "If an immediate hazard keyword (such as 'live wire', 'gas leak', 'sinkhole', 'open manhole') is detected, the safety factor is automatically raised to at least 85/100, and the final priority score is guaranteed a minimum floor of 75/100 (Critical level).",
  },
};

export const DUPLICATE_ENGINE_DETAILS = {
  maxDistanceMeters: 150,
  maxAgeDays: 30,
  confidenceThreshold: 0.60,
  textWeight: 0.60,
  proximityWeight: 0.40,
  policy: "CivicFlow NEVER automatically deletes or merges complaints. Every citizen's voice is preserved, and duplicate relations are linked to amplify the Related Reports factor without erasing individual reports.",
};
