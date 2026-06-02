"use client";

import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { PontoMapa } from "@/lib/distancia";

import "leaflet/dist/leaflet.css";

type MapaRotaInnerProps = {
  origem: PontoMapa | null;
  destino: PontoMapa | null;
  trilha: [number, number][];
  altura?: number;
};

function AjustarVisualizacao({
  pontos,
}: {
  pontos: [number, number][];
}) {
  const map = useMap();

  useEffect(() => {
    if (pontos.length >= 2) {
      map.fitBounds(pontos, { padding: [48, 48] });
    } else if (pontos.length === 1) {
      map.setView(pontos[0], 8);
    }
  }, [map, pontos]);

  return null;
}

export default function MapaRotaInner({
  origem,
  destino,
  trilha,
  altura = 360,
}: MapaRotaInnerProps) {
  const centro: [number, number] = origem
    ? [origem.lat, origem.lon]
    : [-15.78, -47.93];

  const pontosBounds: [number, number][] = trilha.length
    ? trilha
    : [
        ...(origem ? ([[origem.lat, origem.lon]] as [number, number][]) : []),
        ...(destino ? ([[destino.lat, destino.lon]] as [number, number][]) : []),
      ];

  return (
    <MapContainer
      center={centro}
      zoom={5}
      scrollWheelZoom={false}
      style={{ height: altura, width: "100%" }}
      className="z-0 rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {!!pontosBounds.length && <AjustarVisualizacao pontos={pontosBounds} />}

      {!!trilha.length && (
        <Polyline
          positions={trilha}
          pathOptions={{
            color: "#d97706",
            weight: 5,
            opacity: 0.85,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}

      {origem && (
        <CircleMarker
          center={[origem.lat, origem.lon]}
          radius={10}
          pathOptions={{
            color: "#15803d",
            fillColor: "#22c55e",
            fillOpacity: 1,
            weight: 2,
          }}
        >
          <Popup>
            <strong>Origem</strong>
            <br />
            {origem.label}
          </Popup>
        </CircleMarker>
      )}

      {destino && (
        <CircleMarker
          center={[destino.lat, destino.lon]}
          radius={10}
          pathOptions={{
            color: "#b45309",
            fillColor: "#f59e0b",
            fillOpacity: 1,
            weight: 2,
          }}
        >
          <Popup>
            <strong>Destino</strong>
            <br />
            {destino.label}
          </Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
