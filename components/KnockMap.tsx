"use client";

import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect } from "react";
import {
  KnockDTO,
  KNOCK_COLORS,
  KNOCK_LABELS,
  formatDateTime,
} from "@/lib/utils";

type Focus = { lat: number; lng: number; nonce: number } | null;

// Reports map clicks (empty-map taps) back up so we can log a knock there.
function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Flies the map to a focus point whenever it changes (e.g. "use my location").
function Recenter({ focus }: { focus: Focus }) {
  const map = useMap();
  useEffect(() => {
    if (focus) {
      map.flyTo([focus.lat, focus.lng], Math.max(map.getZoom(), 17), {
        duration: 0.75,
      });
    }
  }, [focus, map]);
  return null;
}

export function KnockMap({
  knocks,
  center,
  focus,
  onPick,
  onEdit,
  onDelete,
}: {
  knocks: KnockDTO[];
  center: [number, number];
  focus: Focus;
  onPick: (lat: number, lng: number) => void;
  onEdit: (knock: KnockDTO) => void;
  onDelete: (knock: KnockDTO) => void;
}) {
  return (
    <MapContainer
      center={center}
      zoom={15}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <ClickHandler onPick={onPick} />
      <Recenter focus={focus} />

      {knocks.map((k) => (
        <CircleMarker
          key={k.id}
          center={[k.lat, k.lng]}
          radius={9}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            fillColor: KNOCK_COLORS[k.status],
            fillOpacity: 0.95,
          }}
        >
          <Popup>
            <div className="min-w-[180px] space-y-1.5">
              <p className="text-sm font-semibold text-slate-900">
                {KNOCK_LABELS[k.status]}
              </p>
              {k.address && (
                <p className="text-xs text-slate-600">{k.address}</p>
              )}
              <p className="text-xs text-slate-500">
                {formatDateTime(k.knockedAt)}
              </p>
              {k.clientName && (
                <p className="text-xs text-slate-600">Client: {k.clientName}</p>
              )}
              {k.notes && (
                <p className="text-xs italic text-slate-600">“{k.notes}”</p>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => onEdit(k)}
                  className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(k)}
                  className="rounded-md px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
