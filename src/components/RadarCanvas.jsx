import { useEffect, useRef } from "react";

function getDistance(lat1, lon1, lat2, lon2) {

  const R = 6371000;
  const toRad = (x) => x * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function getBearing(lat1, lon1, lat2, lon2) {

  const toRad = (x) => x * Math.PI / 180;
  const toDeg = (x) => x * 180 / Math.PI;

  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));

  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.cos(toRad(lon2 - lon1));

  return toDeg(Math.atan2(y, x));
}

function RadarCanvas({ players, self }) {

  const canvasRef = useRef(null);

  useEffect(() => {

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    const centerX = width / 2;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = "#00ff88";

    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, i * 60, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = "#00ff88";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fill();

    if (!self) return;

    players.forEach((p) => {

      const distance = getDistance(
        self.latitude,
        self.longitude,
        p.latitude,
        p.longitude
      );

      if (distance > 120) return;

      const bearing = getBearing(
        self.latitude,
        self.longitude,
        p.latitude,
        p.longitude
      );

      const angle = (bearing * Math.PI) / 180;

      const radius = Math.min(distance, 120) * 2;

      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      ctx.fillStyle = "#ff4444";

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
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