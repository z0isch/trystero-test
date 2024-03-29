import * as React from "react";
import { useHostState } from "./useHostState";
import { BaseRoomConfig, RelayConfig } from "trystero";

function Square({
  value,
  onSquareClick,
}: {
  value: string;
  onSquareClick: () => void;
}) {
  return (
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  );
}

function Board({
  xIsNext,
  squares,
  onPlay,
  onPlayAgain,
}: {
  xIsNext: boolean;
  squares: string[];
  onPlay: (squares: string[]) => void;
  onPlayAgain: () => void;
}) {
  function handleClick(i: number) {
    if (calculateWinner(squares) || squares[i]) {
      return;
    }
    const nextSquares = squares.slice();
    if (xIsNext) {
      nextSquares[i] = "X";
    } else {
      nextSquares[i] = "O";
    }
    onPlay(nextSquares);
  }

  const winner = calculateWinner(squares);
  let status;
  if (winner) {
    status = "Winner: " + winner;
  } else {
    status = "Next player: " + (xIsNext ? "X" : "O");
  }

  return (
    <>
      {winner && <button onClick={onPlayAgain}>Play again</button>}
      <div className="status">{status}</div>
      <div className="board-row">
        <Square value={squares[0]} onSquareClick={() => handleClick(0)} />
        <Square value={squares[1]} onSquareClick={() => handleClick(1)} />
        <Square value={squares[2]} onSquareClick={() => handleClick(2)} />
      </div>
      <div className="board-row">
        <Square value={squares[3]} onSquareClick={() => handleClick(3)} />
        <Square value={squares[4]} onSquareClick={() => handleClick(4)} />
        <Square value={squares[5]} onSquareClick={() => handleClick(5)} />
      </div>
      <div className="board-row">
        <Square value={squares[6]} onSquareClick={() => handleClick(6)} />
        <Square value={squares[7]} onSquareClick={() => handleClick(7)} />
        <Square value={squares[8]} onSquareClick={() => handleClick(8)} />
      </div>
    </>
  );
}

type State = { squares: string[]; currentMove: number };

export const initialState: State = {
  squares: Array(9).fill(null),
  currentMove: 0,
};

export default function Game({
  roomConfig,
  roomId,
}: {
  roomConfig: BaseRoomConfig & RelayConfig;
  roomId: string;
}) {
  const { peers, state, setState } = useHostState<State>(roomConfig, roomId);
  if (state === "host-not-connected") {
    return <p>Waiting for host...</p>;
  }
  const xIsNext = state.currentMove % 2 === 0;

  return (
    <>
      <div className="game">
        <div className="game-board">
          <Board
            xIsNext={xIsNext}
            squares={state.squares}
            onPlayAgain={() => {
              setState(initialState);
            }}
            onPlay={(nextSquares) =>
              setState({
                squares: nextSquares,
                currentMove: state.currentMove + 1,
              })
            }
          />
        </div>
      </div>
      {Object.entries(peers).length > 0 && (
        <>
          {" "}
          <hr />
          <h2>Peers</h2>
          <ul>
            {Array.from(Object.entries(peers)).map(([peerId, { ping }]) => (
              <li key={peerId}>
                {peerId}
                {ping && ` ${ping}ms`}
              </li>
            ))}
          </ul>{" "}
        </>
      )}
    </>
  );
}

function calculateWinner(squares: string[]) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}
