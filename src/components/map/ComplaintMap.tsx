"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Complaint } from "@/types";
import { detectHotspots } from "@/lib/engine/hotspot";
import { CATEGORY_LABELS, STATUS_LABELS } from "@/lib/constants";
import { MapPin } from "lucide-react";

interface ComplaintMapProps {
  complaints: Complaint[];
  selectedId?: string | null;
  onSelectComplaint?: (complaint: Complaint) => void;
  className?: string;
  showHotspots?: boolean;
}

export const ComplaintMap: React.FC<ComplaintMapProps> = ({
  complaints,
  selectedId,
  onSelectComplaint,
  className = "h-[450px] w-full",
  showHotspots = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Filter complaints that have valid coordinates
  const validComplaints = complaints.filter(
    (c) =>
      c.location &&
      typeof c.location.lat === "number" &&
      typeof c.location.lng === "number" &&
      !isNaN(c.location.lat) &&
      !isNaN(c.location.lng) &&
      c.location.lat !== 0 &&
      c.location.lng !== 0
  );

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default to Bangalore center or first coordinate
      const defaultCenter: [number, number] =
        validComplaints.length > 0
          ? [validComplaints[0].location.lat, validComplaints[0].location.lng]
          : [12.9716, 77.5946];

      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 12,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      // Add clean custom attribution control
      L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
      layerGroupRef.current = layerGroup;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    if (validComplaints.length === 0) return;

    const bounds = L.latLngBounds([]);

    // 1. Draw Hotspot clusters if enabled
    if (showHotspots) {
      const clusterInputs = validComplaints.map((c) => ({
        id: c.id,
        location: c.location,
        category: c.category,
      }));
      const clustering = detectHotspots(clusterInputs, 250);

      clustering.clusters.forEach((cluster) => {
        const circle = L.circle([cluster.center.lat, cluster.center.lng], {
          radius: 250,
          color: "#06b6d4",
          fillColor: "#06b6d4",
          fillOpacity: 0.12,
          weight: 2,
          dashArray: "4, 6",
        });

        circle.bindTooltip(
          `<strong>Hotspot Cluster</strong><br/>${cluster.reportCount} incidents within 250m`,
          { direction: "top", offset: [0, -10] }
        );

        circle.addTo(layerGroup);
      });
    }

    // 2. Render Complaint Markers
    validComplaints.forEach((c) => {
      const latLng: [number, number] = [c.location.lat, c.location.lng];
      bounds.extend(latLng);

      const isSelected = selectedId === c.id;
      const isDuplicate = !!c.duplicate?.ofId;
      const level = c.priority?.level || "low";

      // Marker styling based on priority
      let colorClass = "bg-slate-500";
      let pulseRing = "";

      if (level === "critical") {
        colorClass = "bg-rose-600";
        pulseRing = "ring-4 ring-rose-200 animate-pulse";
      } else if (level === "high") {
        colorClass = "bg-amber-500";
        pulseRing = "ring-2 ring-amber-200";
      } else if (level === "medium") {
        colorClass = "bg-blue-600";
      }

      const dupBorder = isDuplicate ? "border-amber-400 border-[3px]" : "border-white border-2";
      const selectedRing = isSelected ? "ring-4 ring-blue-500" : "";

      const iconHtml = `
        <div class="relative flex items-center justify-center">
          <div class="w-6 h-6 rounded-full ${colorClass} ${dupBorder} ${pulseRing} ${selectedRing} shadow-md flex items-center justify-center text-white text-[10px] font-bold">
            ${c.priority?.score || 0}
          </div>
          ${
            isDuplicate
              ? `<span class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white" title="Duplicate Report"></span>`
              : ""
          }
        </div>
      `;

      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        html: iconHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
      });

      const marker = L.marker(latLng, { icon: customIcon });

      // Interactive popup
      const popupContent = document.createElement("div");
      popupContent.className = "p-2 min-w-[200px] max-w-[260px] text-xs space-y-1.5 font-sans";
      popupContent.innerHTML = `
        <div class="flex items-center justify-between gap-2 border-b border-slate-100 pb-1">
          <span class="font-bold text-slate-800">${CATEGORY_LABELS[c.category] || c.category}</span>
          <span class="px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase ${
            level === "critical"
              ? "bg-rose-100 text-rose-800"
              : level === "high"
              ? "bg-amber-100 text-amber-800"
              : "bg-blue-100 text-blue-800"
          }">${level}</span>
        </div>
        <p class="text-slate-600 leading-snug line-clamp-2">${c.summary || c.text}</p>
        <div class="text-[10px] text-slate-400">
          <span>Status: ${STATUS_LABELS[c.status] || c.status}</span>
          ${isDuplicate ? `<span class="block text-amber-600 font-medium">Duplicate candidate flagged</span>` : ""}
        </div>
        <button id="inspect-btn-${c.id}" class="w-full mt-1.5 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded text-[11px] transition-colors cursor-pointer text-center">
          Inspect & Act
        </button>
      `;

      // Wire button click in popup
      marker.bindPopup(popupContent);
      marker.on("popupopen", () => {
        const btn = document.getElementById(`inspect-btn-${c.id}`);
        if (btn && onSelectComplaint) {
          btn.onclick = () => {
            onSelectComplaint(c);
            marker.closePopup();
          };
        }
      });

      marker.addTo(layerGroup);
    });

    if (validComplaints.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [validComplaints, selectedId, onSelectComplaint, showHotspots]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  if (validComplaints.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center ${className}`}>
        <MapPin className="h-8 w-8 text-slate-300 mb-2" />
        <h4 className="text-sm font-semibold text-slate-700">No Geotagged Locations Available</h4>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Complaints submitted with GPS coordinates or addresses will be rendered on the interactive Reveal spatial map.
        </p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-slate-100">
      <div ref={mapContainerRef} className={className} />
      {/* Legend Overlay */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-white/95 backdrop-blur-xs p-2 rounded-lg border border-slate-200 shadow-xs text-[10px] space-y-1">
        <span className="font-semibold text-slate-700 block">Priority Map Legend</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
          <span>Critical (75-100)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>High (55-74)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          <span>Medium (35-54)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
          <span>Low (&lt;35)</span>
        </div>
        {showHotspots && (
          <div className="flex items-center gap-1.5 pt-0.5 border-t border-slate-100">
            <span className="w-2.5 h-2.5 rounded-full border border-cyan-500 bg-cyan-100"></span>
            <span>Hotspot Cluster (250m)</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default ComplaintMap;
