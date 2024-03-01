import * as React from "react";
import { BaseRoomConfig, RelayConfig, Room, joinRoom } from "trystero";
import { produce } from "immer";

export function useRoom(
  roomConfig: BaseRoomConfig & RelayConfig,
  roomId: string,
  onPeerJoin?: (peerId: string) => void,
  onPeerLeave?: (peerId: string) => void
): { room: Room; peers: Record<string, { ping: number | null }> } {
  const room = React.useRef(joinRoom(roomConfig, roomId));
  const peersRef = React.useRef<Record<string, { ping: number | null }>>({});

  const subFn = React.useCallback((subscribe: () => void) => {
    room.current.onPeerJoin((addMe) => {
      peersRef.current = produce(peersRef.current, (draftPeers) => {
        draftPeers[addMe] = { ping: null };
      });
      onPeerJoin && onPeerJoin(addMe);
      subscribe();
    });

    room.current.onPeerLeave((removeMe) => {
      peersRef.current = produce(peersRef.current, (draftPeers) => {
        delete draftPeers[removeMe];
      });
      onPeerLeave && onPeerLeave(removeMe);
      subscribe();
    });

    const pingTime = 2000;
    const pinger = setInterval(async () => {
      const pings: Record<string, number | null> = Object.fromEntries(
        await Promise.all(
          Object.keys(peersRef.current).map(async (peerId) => {
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

      peersRef.current = produce(peersRef.current, (draftPeers) => {
        for (const peerId of Object.keys(draftPeers)) {
          draftPeers[peerId] = { ping: pings[peerId] ? pings[peerId] : null };
        }
      });
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
  const peers = React.useSyncExternalStore(subFn, () => peersRef.current);
  return { room: room.current, peers };
}
