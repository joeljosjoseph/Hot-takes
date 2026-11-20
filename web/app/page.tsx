"use client";

import { useGame } from "@/hooks/useGame";
import JoinForm from "@/components/JoinForm";
import Lobby from "@/components/Lobby";
import Answering from "@/components/Answering";
import Voting from "@/components/Voting";
import Results from "@/components/Results";
import GameOver from "@/components/GameOver";

export default function Home() {
  const game = useGame();
  const room = game.room;

  if (!room) {
    return (
      <JoinForm
        connected={game.isConnected}
        error={game.error}
        onCreate={game.createRoom}
        onJoin={game.joinRoom}
      />
    );
  }

  switch (room.phase) {
    case "ANSWERING":
      return (
        <Answering
          room={room}
          submitted={game.submitted}
          error={game.error}
          onDraft={game.sendDraft}
          onSubmit={game.submitAnswer}
        />
      );
    case "VOTING":
      return (
        <Voting
          room={room}
          options={game.options}
          voted={game.voted}
          error={game.error}
          onVote={game.vote}
        />
      );
    case "RESULTS":
      return (
        <Results
          room={room}
          myId={game.myId}
          results={game.results}
          error={game.error}
          onNext={game.nextRound}
        />
      );
    case "GAME_OVER":
      return (
        <GameOver
          room={room}
          myId={game.myId}
          error={game.error}
          onPlayAgain={game.playAgain}
        />
      );
    default:
      return (
        <Lobby
          room={room}
          myId={game.myId}
          error={game.error}
          onStart={game.startGame}
        />
      );
  }
}
