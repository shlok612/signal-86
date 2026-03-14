import { useEffect } from "react";
import { socket } from "../socket/socketClient";

function GameScreen({ role,roomCode, playerId }) {

  useEffect(() => {

      if (!navigator.geolocation) {
        console.log("Geolocation not supported");
        return;
      }

      const watchId = navigator.geolocation.watchPosition(

        (position) => {

          const { latitude, longitude, speed } = position.coords;

          socket.emit("location_update", {

            roomCode,
            playerId,
            latitude,
            longitude,
            speed: speed || 0,
            timestamp: Math.floor(Date.now() / 1000)

          });

        },

        (err) => {
          console.log("GPS error:", err);
        },

        {
          enableHighAccuracy: true,
          maximumAge: 1000
        }

      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
      };

    }, [roomCode, playerId]);
      return (

    <div className="room-container">

      <div className="room-box">


        <h2 className="room-title">
          SIGNAL 86
        </h2>

        <div className="room-subtitle">
          Your Role
        </div>

        <div className="room-code">
          {role ? role.toUpperCase() : "LOADING"}
        </div>

      </div>

    </div>

  );

}

export default GameScreen;