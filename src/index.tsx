import * as React from "react";
import {
  getStateFromStorage,
  hostedRoomIds,
  saveStateToStorage,
} from "./usePeerState";
import Game, { initialState } from "./ticTacToe";
import ReactDOM from "react-dom/client";
import { joinRoom } from "trystero";

const roomConfig = { appId: "aj_testing" };

const App = () => {
  const [currentRoom, setCurrentRoom] = React.useState<string | null>(null);
  const localStorage = React.useSyncExternalStore(
    (listener) => {
      window.addEventListener("storage", listener);
      return () => {
        window.removeEventListener("storage", listener);
      };
    },
    () => window.localStorage
  );
  const myRooms = hostedRoomIds(localStorage);

  const [rooms, setRooms] = React.useState<Set<string>>(new Set());

  const room = React.useRef(joinRoom(roomConfig, "lobby"));
  const [sendRooms, receiveRooms] = room.current.makeAction<string[]>("rooms");
  const [removeRooms, receiveRemoveRooms] =
    room.current.makeAction<string[]>("remove-rooms");

  React.useEffect(() => {
    room.current.onPeerJoin(() => {
      sendRooms(Array.from(hostedRoomIds(window.localStorage)));
    });

    return () => {
      room.current.leave();
    };
  }, []);

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
      {rooms.size === 0 ? (
        <p>Loading...</p>
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
    </>
  );
};

const root = ReactDOM.createRoot(document.getElementById("container") as any);
root.render(<App />);
