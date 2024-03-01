import * as React from "react";
import { hostedRoomIds, saveStateToStorage } from "./usePeerState";
import Game, { initialState } from "./ticTacToe";
import ReactDOM from "react-dom/client";
import { useRoom } from "./useRoom";

const roomConfig = { appId: "aj_testing" };

const App = () => {
  const [currentRoom, setCurrentRoom] = React.useState<string | null>(null);
  const [myRooms, setMyRooms] = React.useState<Set<string>>(
    hostedRoomIds(window.localStorage)
  );

  const [rooms, setRooms] = React.useState<Set<string>>(new Set());

  const { room, peers } = useRoom(roomConfig, "lobby", () =>
    sendRooms(Array.from(myRooms))
  );
  const [sendRooms, receiveRooms] = room.makeAction<string[]>("rooms");
  const [removeRooms, receiveRemoveRooms] =
    room.makeAction<string[]>("remove-rooms");

  receiveRooms((rooms) => {
    setRooms((roomSet) => {
      const s = new Set<string>();
      rooms.forEach((r) => s.add(r));
      roomSet.forEach((r) => s.add(r));
      return s;
    });
  });

  receiveRemoveRooms((rooms) => {
    setRooms((roomSet) => {
      const s = new Set<string>();
      roomSet.forEach((r) => s.add(r));
      rooms.forEach((r) => s.delete(r));
      return s;
    });
  });

  return currentRoom ? (
    <>
      <button
        onClick={() => {
          window.localStorage.clear();
          setMyRooms((rs) => {
            const s = new Set<string>();
            rs.forEach((r) => s.add(r));
            s.delete(currentRoom);
            return s;
          });
          setCurrentRoom(null);
          removeRooms([currentRoom]);
        }}
      >
        Leave game
      </button>
      <hr />
      <Game roomConfig={roomConfig} roomId={currentRoom} />
    </>
  ) : (
    <>
      {myRooms.size === 0 ? (
        <button
          onClick={() => {
            const roomId = crypto.randomUUID();
            saveStateToStorage(roomId, initialState);
            setCurrentRoom(roomId);
            setMyRooms((rs) => {
              const s = new Set<string>();
              rs.forEach((r) => s.add(r));
              rs.add(roomId);
              return s;
            });
            sendRooms([roomId]);
          }}
        >
          Host new game
        </button>
      ) : (
        <>
          <h2>My games</h2>
          <ul>
            {Array.from(myRooms).map((roomId) => (
              <li key={roomId}>
                <button
                  onClick={() => {
                    window.localStorage.clear();
                    setMyRooms((rs) => {
                      const s = new Set<string>();
                      rs.forEach((r) => s.add(r));
                      s.delete(roomId);
                      return s;
                    });
                    removeRooms([roomId]);
                  }}
                >
                  ❌
                </button>{" "}
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
        </>
      )}
      <hr />
      <h2>Peer games</h2>
      {Object.keys(peers).length === 0 ? (
        <p>No peers connected</p>
      ) : rooms.size === 0 ? (
        <p>No active games</p>
      ) : (
        <ul>
          {Array.from(rooms).map((roomId) => (
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
          <h2>Pings</h2>
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
