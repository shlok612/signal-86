import { useEffect, useState } from "react";
import { socket } from "../socket/socketClient";
import RadarCanvas from "./RadarCanvas";

function GameScreen({ role, roomCode, playerId }) {

  const [timeRemaining,setTimeRemaining] = useState(1200);
  const [radarPlayers,setRadarPlayers] = useState([]);
  // Last-known positions from server so we keep showing others when radar_update sometimes sends []
  const [lastKnownRadar, setLastKnownRadar] = useState({});
  const [selfLocation,setSelfLocation] = useState(null);
  const [allPlayers,setAllPlayers] = useState({});
  const [danger,setDanger] = useState(null);
  const [dangerCountdown, setDangerCountdown] = useState(null);
  const [demogorgonRadar,setDemogorgonRadar] = useState(false);
  const [socketError, setSocketError] = useState(null);

  // ======================
  // GPS STREAMING
  // ======================

  useEffect(()=>{

    if(!navigator.geolocation){
      console.log("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(

      (pos)=>{

        const { latitude,longitude,speed } = pos.coords;

        setSelfLocation({
          latitude,
          longitude
        });

        setAllPlayers(prev=>({
          ...prev,
          [playerId]:{
            latitude,
            longitude
          }
        }));

        socket.emit("location_update",{
          roomCode,
          playerId,
          latitude,
          longitude,
          speed: speed || 0,
          timestamp: Math.floor(Date.now()/1000)
        });

      },

      (err)=>{
        console.log("GPS error",err);
      },

      {
        enableHighAccuracy:true,
        maximumAge:1000
      }

    );

    return ()=>{
      navigator.geolocation.clearWatch(watchId);
    };

  },[roomCode,playerId]);


  // ======================
  // GAME TIMER
  // ======================

  useEffect(()=>{

    const handleGameState=(data)=>{
      if (data && typeof data.timeRemainingSeconds === "number") {
        setTimeRemaining(data.timeRemainingSeconds);
      }
    };

    socket.on("game_state",handleGameState);

    return ()=>{
      socket.off("game_state",handleGameState);
    };

  },[]);


  // ======================
  // RADAR UPDATE FROM SERVER
  // ======================

  useEffect(()=>{

    const handleRadar=(data)=>{
      const list = Array.isArray(data?.players) ? data.players : [];
      setRadarPlayers(list);
      // Merge into last-known so every device keeps showing others even when server sends [] sometimes
      if (list.length > 0) {
        setLastKnownRadar((prev) => {
          const next = { ...prev };
          list.forEach((p) => {
            if (p != null && typeof p.playerNumber !== "undefined" && typeof p.latitude === "number" && typeof p.longitude === "number") {
              next[p.playerNumber] = {
                playerNumber: p.playerNumber,
                latitude: p.latitude,
                longitude: p.longitude,
                updatedAt: Date.now(),
              };
            }
          });
          return next;
        });
      }
    };

    socket.on("radar_update",handleRadar);

    return ()=>{
      socket.off("radar_update",handleRadar);
    };

  },[]);


  // ======================
  // DEMOGORGON RADAR WINDOW
  // ======================

  useEffect(()=>{

    const radarOn=()=>setDemogorgonRadar(true);
    const radarOff=()=>setDemogorgonRadar(false);

    socket.on("demogorgon_radar_active",radarOn);
    socket.on("demogorgon_radar_off",radarOff);

    return ()=>{
      socket.off("demogorgon_radar_active",radarOn);
      socket.off("demogorgon_radar_off",radarOff);
    };

  },[]);


  // ======================
  // SOCKET ERROR (spec: payload { code, message })
  // ======================

  useEffect(() => {
    const handleError = (payload) => {
      const message = payload?.message ?? payload?.code ?? "Something went wrong";
      setSocketError(typeof message === "string" ? message : "Unknown error");
    };
    socket.on("error", handleError);
    return () => {
      socket.off("error", handleError);
    };
  }, []);

  // ======================
  // DANGER ALERT
  // ======================

  useEffect(()=>{

    const handleDanger=(data)=>{
      if (!data) return;
      setDanger(typeof data.distance === "number" ? data.distance : null);
      setDangerCountdown(typeof data.countdownRemaining === "number" ? data.countdownRemaining : null);
    };

    socket.on("danger_alert",handleDanger);

    return ()=>{
      socket.off("danger_alert",handleDanger);
    };

  },[]);


  // ======================
  // RADAR DATA: server snapshot or last-known so every device sees others
  // ======================

  const STALE_MS = 20000; // stop showing positions not seen for 20s
  const now = Date.now();
  const freshLastKnown = Object.values(lastKnownRadar)
    .filter((p) => p && (now - (p.updatedAt ?? 0)) < STALE_MS)
    .map(({ playerNumber, latitude, longitude }) => ({ playerNumber, latitude, longitude }));

  const radarData =
    radarPlayers.length > 0 ? radarPlayers : freshLastKnown;


  // ======================
  // TIMER DISPLAY
  // ======================

  const minutes = Math.floor(timeRemaining/60);
  const seconds = timeRemaining % 60;


  return (

    <div className="room-container">

      <div className="room-box">

        <h2 className="room-title">
          SIGNAL 86
        </h2>

        <div className="room-subtitle">
          {minutes}:{seconds.toString().padStart(2,"0")}
        </div>

        <div className="room-subtitle">
          Your Role
        </div>

        <div className="room-code">
          {role ? role.toUpperCase() : "LOADING"}
        </div>


        {/* Socket error (spec: error event) */}

        {socketError && (
          <div style={{
            marginTop: "12px",
            padding: "8px 12px",
            background: "rgba(255, 68, 68, 0.15)",
            color: "#ff4444",
            borderRadius: "6px",
            fontSize: "14px"
          }}>
            {socketError}
          </div>
        )}

        {/* Danger alert (spec: show distance and countdownRemaining) */}

        {danger != null && role === "cypher" && (

          <div style={{
            marginTop:"20px",
            color:"red",
            fontWeight:"bold"
          }}>
            DEMOGORGON NEARBY ({Number(danger).toFixed(1)}m)
            {dangerCountdown != null && (
              <span style={{ display: "block", marginTop: "4px", fontSize: "14px" }}>
                Countdown: {Number(dangerCountdown).toFixed(1)}s
              </span>
            )}
          </div>

        )}


        {/* Demogorgon radar window */}

        {role === "demogorgon" && demogorgonRadar && (

          <div style={{
            marginTop:"20px",
            color:"#ff4444"
          }}>
            RADAR ACTIVE
          </div>

        )}


        {/* RADAR */}

        <RadarCanvas
          players={radarData}
          self={selfLocation}
        />

      </div>

    </div>

  );

}

export default GameScreen;