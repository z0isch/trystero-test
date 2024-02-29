import * as React from "react";
import {
  BaseRoomConfig,
  DataPayload,
  RelayConfig,
  joinRoom,
  selfId,
} from "trystero";

export function getStateFromStorage<S>(roomId: string): S | null {
  const s = window.localStorage.getItem(`${roomId}:state`);
  return s === null ? null : JSON.parse(s);
}

export function saveStateToStorage<S>(roomId: string, state: S) {
  window.localStorage.setItem(`${roomId}:state`, JSON.stringify(state));
}

export function usePeerState<S extends DataPayload>(
  roomConfig: BaseRoomConfig & RelayConfig,
  roomId: string
): {
  state: S | "host-not-connected";
  setState: (s: S) => void;
} {
  const room = React.useRef(joinRoom(roomConfig, roomId));
  const isHost = React.useRef<boolean>(getStateFromStorage(roomId) !== null);
  const host = React.useRef<string | null>(null);
  const [state, setState] = React.useState<S | null>(
    getStateFromStorage(roomId)
  );
  const [peers, setPeers] = React.useState<string[]>([]);

  const [sendState, receiveState] = room.current.makeAction<S>("state");
  const [sendHost, receiveHost] = room.current.makeAction<string>("host");

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
    room.current.onPeerJoin((peerId) => {
      console.log("Peer joined:", { peerId });
      setPeers((ps) => [peerId, ...ps]);
    });

    room.current.onPeerLeave((peerId) => {
      console.log("Peer left:", { peerId });
      setPeers((ps) => ps.filter((p) => p !== peerId));
    });
    return () => {
      room.current.leave();
    };
  }, []);

  React.useEffect(() => {
    if (isHost.current) {
      console.log("Sending host and state:", { state, selfId, peers });
      if (state !== null) sendState(state);
      sendHost(selfId);
    } else if (!peers.find((p) => p === host.current)) {
      console.log("Host not found:", { host, peers });
      setState(null);
    }
  }, [peers]);

  return {
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
