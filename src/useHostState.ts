import * as React from "react";
import {
  BaseRoomConfig,
  DataPayload,
  RelayConfig,
  Room,
  selfId,
} from "trystero/firebase";
import { useRoom } from "./useRoom";

export function hostedRoomId(localStorage: Storage): string | null {
  for (const i of Object.keys(localStorage)) {
    return i.split(":")[0];
  }
  return null;
}

const stateKey = (roomId: string) => `${roomId}:state`;

export function getStateFromStorage<S>(roomId: string): S | null {
  const s = window.localStorage.getItem(stateKey(roomId));
  return s === null ? null : JSON.parse(s);
}

export function saveStateToStorage<S>(roomId: string, state: S) {
  window.localStorage.setItem(stateKey(roomId), JSON.stringify(state));
}

export function deleteStateFromStorage(roomId: string) {
  window.localStorage.removeItem(stateKey(roomId));
}

export function useHostState<S extends DataPayload>(
  roomConfig: BaseRoomConfig & RelayConfig,
  roomId: string
): {
  room: Room;
  peers: Record<string, { ping: number | null }>;
  state: S | "host-not-connected";
  setState: (s: S) => void;
} {
  const { room, peers } = useRoom(roomConfig, roomId);
  const isHost = React.useRef<boolean>(getStateFromStorage(roomId) !== null);
  const host = React.useRef<string | null>(null);
  const [state, setState] = React.useState<S | null>(
    getStateFromStorage(roomId)
  );
  const [sendState, receiveState] = room.makeAction<S>("state");
  const [sendHost, receiveHost] = room.makeAction<string>("host");

  receiveState((state) => {
    console.log("Receiving state:", { state });
    if (isHost.current) {
      saveStateToStorage(roomId, state);
    }
    setState(state);
  });

  receiveHost((h) => {
    console.log("Receiving host:", { h });
    host.current = h;
  });

  React.useEffect(() => {
    if (isHost.current) {
      console.log("Sending host and state:", { state, selfId, peers });
      if (state !== null) sendState(state);
      sendHost(selfId);
    } else if (!Object.keys(peers).find((p) => p === host.current)) {
      console.log("Host not found:", { host, peers });
      setState(null);
    }
  }, [peers]);

  return {
    room,
    peers,
    state: state ?? "host-not-connected",
    setState: (state: S) => {
      setState(state);
      sendState(state);
      if (isHost.current) {
        saveStateToStorage(roomId, state);
      }
    },
  };
}
