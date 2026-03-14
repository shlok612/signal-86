import { useEffect, useRef } from "react";

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (x) => x * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearing(lat1, lon1, lat2, lon2) {
  const toRad = (x) => x * Math.PI / 180;

  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.cos(toRad(lon2 - lon1));

  return Math.atan2(y, x);
}

function RadarCanvas({ players, self }) {

  const canvasRef = useRef(null);

  useEffect(() => {

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const size = 300;
    const center = size / 2;
    const radarRadius = 120;
    const maxDisplayMeters = 200; // show others up to 200m; farther = clamped to edge

    ctx.clearRect(0, 0, size, size);

    ctx.strokeStyle = "#00ff88";
    ctx.lineWidth = 1;

    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(center, center, radarRadius * i / 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = "#00ff88";
    ctx.beginPath();
    ctx.arc(center, center, 5, 0, Math.PI * 2);
    ctx.fill();

    if (!self || typeof self.latitude !== "number" || typeof self.longitude !== "number") return;

    const safePlayers = Array.isArray(players) ? players : [];

    safePlayers.forEach((p) => {

      const lat = p?.latitude;
      const lon = p?.longitude;
      if (typeof lat !== "number" || typeof lon !== "number") return;

      const dist = haversine(
        self.latitude,
        self.longitude,
        lat,
        lon
      );

      const ang = bearing(
        self.latitude,
        self.longitude,
        lat,
        lon
      );

      // Show all others: clamp to edge so far players still appear on radar
      const r = Math.min(1, dist / maxDisplayMeters) * radarRadius;

      const x = center + r * Math.cos(ang);
      const y = center + r * Math.sin(ang);

      ctx.fillStyle = "#ff4444";

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

    });

  }, [players, self]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={300}
      style={{
        marginTop: "20px",
        border: "1px solid #00ff88",
        borderRadius: "50%"
      }}
    />
  );

}

export default RadarCanvas;