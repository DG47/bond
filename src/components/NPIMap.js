// src/components/NPIMap.js
import React, { useEffect, useState } from "react";
import { Box, Typography, Paper } from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet icons in CRA
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const NPIMap = ({ data = [], subsidiaryName = "" }) => {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    if (!data.length || !subsidiaryName) return;

    // Filter rows for the current subsidiaryName (case-insensitive)
    const filtered = data
      .filter(
        (row) =>
          row.subsidiary_co?.toLowerCase().trim() ===
          subsidiaryName.toLowerCase().trim()
      )
      .map((row) => ({
        name: row.provider_name || "Unknown",
        lat: parseFloat(row.latitude),
        lng: parseFloat(row.longitude),
      }))
      .filter((loc) => !isNaN(loc.lat) && !isNaN(loc.lng));

    setLocations(filtered);
  }, [data, subsidiaryName]);

  if (!data.length || !subsidiaryName) return null;

  const center = locations.length
    ? [locations[0].lat, locations[0].lng]
    : [39.8283, -98.5795]; // fallback center

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Provider Locations (NPI Map)
      </Typography>
      <Paper elevation={3} sx={{ height: 400, overflow: "hidden" }}>
        <MapContainer center={center} zoom={4} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {locations.map((loc, index) => (
            <Marker key={index} position={[loc.lat, loc.lng]}>
              <Popup>{loc.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </Paper>
    </Box>
  );
};

export default NPIMap;