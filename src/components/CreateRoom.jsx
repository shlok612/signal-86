import { useEffect, useState } from "react";
import { socket } from "../socket/socketClient";

function CreateRoom({
  isHost,
  roomCode,
  setRoomCode,
  playerId,
  setPlayerId,
  setScreen,
  setRole
}){
  const [players, setPlayers] = useState([]);
  const [socketError, setSocketError] = useState(null);

  useEffect(() => {

    const handleRoomCreated = (data) => {
      if (!data || typeof data.roomCode !== "string") return;
      setSocketError(null);
      setRoomCode(data.roomCode);
      setPlayerId(data.playerId);
    };

    const handleRoomPlayers = (data) => {
      if (data && Array.isArray(data.players)) {
        setPlayers(data.players);
      }
    };

    const handleError = (payload) => {
      const msg = payload?.message ?? payload?.code ?? "Something went wrong";
      setSocketError(typeof msg === "string" ? msg : "Unknown error");
    };

    const handleRoleAssignment = (data) => {
      if (!data || !data.role) return;
      setSocketError(null);
      setRole(data.role);
      setScreen("game");
    };

    socket.on("room_created", handleRoomCreated);
    socket.on("room_players", handleRoomPlayers);
    socket.on("error", handleError);
    socket.on("role_assignment", handleRoleAssignment);
    if (isHost && !roomCode) {

      socket.emit("create_room", {
        playerName: "Host"
      });

    }

    return () => {
      socket.off("role_assignment", handleRoleAssignment);
      socket.off("room_created", handleRoomCreated);
      socket.off("room_players", handleRoomPlayers);
      socket.off("error", handleError);
    };

  }, [isHost, roomCode, setRoomCode, setPlayerId]);

  useEffect(() => {

      const handleRole = (data) => {

        console.log("ROLE:", data);

        setRole(data.role);
        setScreen("game");

      };

      socket.on("role_assignment", handleRole);

      return () => {
        socket.off("role_assignment", handleRole);
      };

}, []);
  const startGame = () => {

    socket.emit("start_game", {
      roomCode,
      playerId
    });

  };

  return (

    <div className="room-container">

      <div className="room-box">

        <h2 className="room-title">
          ROOM LOBBY
        </h2>

        <div className="room-code">
          {roomCode || "...."}
        </div>

        <div className="room-subtitle">
          Share this code with your team
        </div>

        <div className="players-list">

          {players.length === 0 && (
            <div className="player-item">
              Waiting for players...
            </div>
          )}

          {players.map((player) => (
            <div
              key={player.playerId}
              className="player-item"
            >
              PLAYER {player.playerNumber}
              {player.isHost ? " (HOST)" : ""}
            </div>
          ))}

        </div>

        <div className="room-status">
          {players.length} player{players.length !== 1 && "s"} in lobby
        </div>

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

        {isHost && (

          <>
            <div style={{marginTop:"20px",marginBottom:"10px"}}>
              TAKE POSITIONS
            </div>

            <button
              className="menu-button"
              onClick={startGame}
            >
              START GAME
            </button>
          </>

        )}

      </div>

    </div>

  );

}

export default CreateRoom;