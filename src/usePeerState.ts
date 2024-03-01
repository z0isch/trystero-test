import { ActionSender, DataPayload, JsonValue, Room } from "trystero";
import { useImmer } from "use-immer";

export function usePeerState<S extends DataPayload>(
  room: Room,
  namespace: string,
  initialData: S | null,
  onReceiveData?: (data: S, peerId: string, metadata?: JsonValue) => void
): {
  data: Map<string, S>;
  sendData: ActionSender<S | null>;
  onPeerLeave: (peerId: string) => void;
  onPeerJoin: (peerId: string) => void;
} {
  const [data, setData] = useImmer<Map<string, S>>(new Map());
  const [sendData, receiveData] = room.makeAction<S | null>(namespace);

  receiveData((data, peerId, metadata) => {
    setData((draftData) => {
      if (data) {
        //@ts-ignore
        draftData.set(peerId, data);
        if (onReceiveData) onReceiveData(data, peerId, metadata);
      } else {
        draftData.delete(peerId);
      }
    });
  });

  return {
    data,
    sendData,
    onPeerLeave: (peerId) =>
      setData((draftData) => {
        draftData.delete(peerId);
      }),
    onPeerJoin: (peerId) => sendData(initialData, peerId),
  };
}
