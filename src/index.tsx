import * as React from "react";
import ReactDOM from "react-dom";
import { BaseRoomConfig, RelayConfig, Room } from "trystero";
import { getStateFromStorage, saveStateToStorage } from "./usePeerState";
import Game from "./ticTacToe";

const App = () => {
  const roomConfig = { appId: "aj_testing" };
  const roomId = "aj";
  const [inGame, setInGame] = React.useState(
    getStateFromStorage(roomId) !== null
  );
  const [isHost, setIsHost] = React.useState(
    getStateFromStorage(roomId) !== null
  );

  return (
    <>
      {!inGame && (
        <button
          onClick={() => {
            saveStateToStorage(roomId, {
              squares: Array(9).fill(null),
              currentMove: 0,
            });
            setInGame(true);
            setIsHost(true);
          }}
        >
          Host
        </button>
      )}
      {inGame && (
        <button
          onClick={() => {
            window.localStorage.clear();
            setInGame(false);
            setIsHost(false);
          }}
        >
          {isHost ? "Clear Host" : "Leave game"}
        </button>
      )}
      {!inGame && (
        <button
          onClick={() => {
            setInGame(true);
          }}
        >
          Join
        </button>
      )}
      {inGame && <Game roomConfig={roomConfig} roomId={roomId} />}
    </>
  );
};

const root = ReactDOM.createRoot(document.body);
root.render(<App />);
