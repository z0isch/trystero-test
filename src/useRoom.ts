import * as React from "react";
import { BaseRoomConfig, RelayConfig, Room, joinRoom } from "trystero";

export function useRoom(
  roomConfig: BaseRoomConfig & RelayConfig,
  roomId: string,
  onPeerJoin?: (peerId: string) => void,
  onPeerLeave?: (peerId: string) => void
): { room: Room; peers: Record<string, { ping: number | null }> } {
  const room = React.useRef(joinRoom(roomConfig, roomId));
  const peerRef = React.useRef<Record<string, { ping: number | null }>>({});
  const subFn = React.useCallback((subscribe: () => void) => {
    room.current.onPeerJoin((addMe) => {
      const clone = structuredClone(peerRef.current);
      clone[addMe] = { ping: null };
      peerRef.current = clone;
      onPeerJoin && onPeerJoin(addMe);
      subscribe();
    });
    room.current.onPeerLeave((removeMe) => {
      console.log({ removeMe });
      const clone = structuredClone(peerRef.current);
      delete clone[removeMe];
      peerRef.current = clone;
      onPeerLeave && onPeerLeave(removeMe);
      subscribe();
    });

    const pingTime = 2000;
    const pinger = setInterval(async () => {
      const pings: Record<string, number | null> = Object.fromEntries(
        await Promise.all(
          Object.keys(peerRef.current).map(async (peerId) => {
            let pingThread;
            const pingCancel = new Promise<null>(
              (resolve) =>
                (pingThread = setTimeout(() => {
                  resolve(null);
                }, pingTime - 500))
            );
            const ping = await Promise.race([
              pingCancel,
              room.current.ping(peerId),
            ]);
            if (pingThread) clearTimeout(pingThread);
            return [peerId, ping];
          })
        )
      );
      const clone = structuredClone(peerRef.current);
      for (const peerId of Object.keys(clone)) {
        clone[peerId] = { ping: pings[peerId] ? pings[peerId] : null };
      }
      peerRef.current = clone;
      subscribe();
    }, pingTime);

    const onBeforeUnload = () => {
      room.current.leave();
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      room.current.leave();
      clearInterval(pinger);
    };
  }, []);
  const peers = React.useSyncExternalStore(subFn, () => peerRef.current);
  return { room: room.current, peers };
}
