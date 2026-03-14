import { useEffect, useState } from "react";
import RadarCanvas from "./RadarCanvas";
import { socket } from "../socket/socketClient";

function GameScreen({ role, roomCode, playerId }) {

  const [timeRemaining,setTimeRemaining] = useState(1200);
  const [radarPlayers,setRadarPlayers] = useState([]);
  const [danger,setDanger] = useState(null);
  const [demogorgonRadar,setDemogorgonRadar] = useState(false);

  // =========================
  // GPS STREAMING
  // =========================

  useEffect(()=>{

    if(!navigator.geolocation){
      console.log("Geolocation not supported");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(

      (pos)=>{

        const { latitude,longitude,speed } = pos.coords;

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


  // =========================
  // GAME STATE TIMER
  // =========================

  useEffect(()=>{

    const handleGameState=(data)=>{

      if(data.timeRemainingSeconds !== undefined){
        setTimeRemaining(data.timeRemainingSeconds);
      }

    };

    socket.on("game_state",handleGameState);

    return ()=>{
      socket.off("game_state",handleGameState);
    };

  },[]);


  // =========================
  // RADAR UPDATE
  // =========================

  useEffect(()=>{

    const handleRadar=(data)=>{

      if(data.players){
        setRadarPlayers(data.players);
      }

    };

    socket.on("radar_update",handleRadar);

    return ()=>{
      socket.off("radar_update",handleRadar);
    };

  },[]);


  // =========================
  // DANGER ALERT
  // =========================

  useEffect(()=>{

    const handleDanger=(data)=>{
      setDanger(data.distance);
    };

    socket.on("danger_alert",handleDanger);

    return ()=>{
      socket.off("danger_alert",handleDanger);
    };

  },[]);


  // =========================
  // DEMOGORGON RADAR WINDOW
  // =========================

  useEffect(()=>{

    const radarOn=()=>{
      setDemogorgonRadar(true);
    };

    const radarOff=()=>{
      setDemogorgonRadar(false);
    };

    socket.on("demogorgon_radar_active",radarOn);
    socket.on("demogorgon_radar_off",radarOff);

    return ()=>{
      socket.off("demogorgon_radar_active",radarOn);
      socket.off("demogorgon_radar_off",radarOff);
    };

  },[]);


  // =========================
  // GAME END
  // =========================

  useEffect(()=>{

    const handleGameEnd=(data)=>{
      alert("Game Over! Winner: "+data.winner);
    };

    socket.on("game_end",handleGameEnd);

    return ()=>{
      socket.off("game_end",handleGameEnd);
    };

  },[]);


  // =========================
  // TIMER DISPLAY
  // =========================

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


        {/* Danger alert */}

        {danger && role === "cypher" && (

          <div style={{
            marginTop:"20px",
            color:"red",
            fontWeight:"bold"
          }}>
            DEMOGORGON NEARBY ({danger.toFixed(1)}m)
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


        {/* Radar data preview */}

        <div style={{marginTop:"30px"}}>

          <RadarCanvas players={radarPlayers} />

        </div>

      </div>

    </div>

  );

}

export default GameScreen;