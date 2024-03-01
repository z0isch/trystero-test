import * as React from "react";
import { hostedRoomId, saveStateToStorage } from "./useHostState";
import Game, { initialState } from "./ticTacToe";
import ReactDOM from "react-dom/client";
import { useRoom } from "./useRoom";
import { enableMapSet } from "immer";
import { useImmer } from "use-immer";
import { usePeerState } from "./usePeerState";

enableMapSet();

const roomConfig = { appId: "aj_testing" };

const App = () => {
  const [currentRoom, setCurrentRoom] = React.useState<string | null>(null);
  const [myRoom, setMyRoom] = useImmer<string | null>(
    hostedRoomId(window.localStorage)
  );
  const { room, peers } = useRoom(
    roomConfig,
    "lobby",
    (peerId) => sendRoom(myRoom, peerId),
    (peerId) => onPeerLeave(peerId)
  );

  const {
    data: rooms,
    sendData: sendRoom,
    onPeerLeave,
  } = usePeerState<string>(room, "rooms");

  return currentRoom ? (
    <>
      <button
        onClick={() => {
          window.localStorage.clear();
          setMyRoom(null);
          setCurrentRoom(null);
          sendRoom(null);
        }}
      >
        Leave game
      </button>
      <hr />
      <Game roomConfig={roomConfig} roomId={currentRoom} />
    </>
  ) : (
    <>
      {myRoom ? (
        <>
          <h2>My games</h2>
          <button
            onClick={() => {
              window.localStorage.clear();
              setMyRoom(null);
              sendRoom(null);
            }}
          >
            ❌
          </button>{" "}
          <a
            href="#"
            onClick={() => {
              setCurrentRoom(myRoom);
            }}
          >
            {myRoom}
          </a>
        </>
      ) : (
        <button
          onClick={() => {
            const roomId = crypto.randomUUID();
            saveStateToStorage(roomId, initialState);
            setCurrentRoom(roomId);
            setMyRoom(roomId);
            sendRoom(roomId);
          }}
        >
          Host new game
        </button>
      )}
      <hr />
      <h2>Peer games</h2>
      {Object.keys(peers).length === 0 ? (
        <p>No peers connected</p>
      ) : rooms.size === 0 ? (
        <p>No active games</p>
      ) : (
        <ul>
          {Array.from(rooms.values()).map((roomId) => (
            <li key={roomId}>
              <a
                href="#"
                onClick={() => {
                  setCurrentRoom(roomId);
                }}
              >
                {roomId}
              </a>
            </li>
          ))}
        </ul>
      )}
      {Object.entries(peers).length > 0 && (
        <>
          {" "}
          <hr />
          <h2>Peers</h2>
          <ul>
            {Array.from(Object.entries(peers)).map(
              ([peerId, { ping }]) =>
                ping && (
                  <li key={peerId}>
                    {peerId}: {ping}ms
                  </li>
                )
            )}
          </ul>{" "}
        </>
      )}
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById("container") as any);
root.render(<App />);
