import * as React from "react";
import ReactDOM from "react-dom";
import { BaseRoomConfig, RelayConfig, Room } from "trystero";
import { usePeerState } from "./usePeerState";

type State = { msgs: string[]; msg: string };

const App = () => {
  const roomConfig = { appId: "aj_testing" };
  const roomId = "aj";
  const [foo, setFoo] = React.useState(true);

  return (
    <>
      <button onClick={() => setFoo((f) => !f)}>Foo</button>
      {foo ? <Room roomConfig={roomConfig} roomId={roomId} /> : null}
    </>
  );
};

const Room = ({
  roomConfig,
  roomId,
}: {
  roomConfig: BaseRoomConfig & RelayConfig;
  roomId: string;
}) => {
  const { state, setState } = usePeerState<State>(roomConfig, roomId);

  switch (state) {
    case "host-not-connected":
      return <p>Host not detected</p>;
    default:
      return (
        <div>
          <input
            onChange={(e) => {
              setState({ ...state, msg: e.target.value });
            }}
            onKeyUp={(e) => {
              if (e.code === "Enter") {
                setState({
                  ...state,
                  msg: "",
                  msgs: [state.msg, ...state.msgs],
                });
              }
            }}
            value={state.msg}
          />
          <ul>
            {state.msgs.map((m) => (
              <li>{m}</li>
            ))}
          </ul>
        </div>
      );
  }
};

const root = ReactDOM.createRoot(document.body);
root.render(<App />);
