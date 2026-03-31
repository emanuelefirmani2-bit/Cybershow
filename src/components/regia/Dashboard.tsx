import { GameControls } from '@/components/regia/GameControls'
import { ScoreWidget } from '@/components/regia/ScoreWidget'
import { ChatMonitor } from '@/components/regia/ChatMonitor'
import { PerformanceAlert } from '@/components/regia/PerformanceAlert'
import type { GameState, TeamId, ChatMessage } from '@/types/index'

interface DashboardProps {
  gameState: GameState | null
  connected: boolean
  chatMessages: Record<TeamId, ChatMessage[]>
  playerCount: number
  onStartVote: () => void
  onStartGame: () => void
  onPlayTrack: (questionId: string) => void
  onStopAudio: () => void
  onStartQuestion: () => void
  onNextQuestion: () => void
  onNextRound: () => void
  onOverrideAnswer: (correct: boolean) => void
  onSkipQuestion: () => void
  onResetSoft: () => void
  onBonus: (teamId: TeamId, points: number) => void
  onUndoScore: () => void
  onSuspense: () => void
  onOkFinale: () => void
  onKickAll: () => void
}

export function Dashboard({
  gameState,
  connected,
  chatMessages,
  playerCount,
  onStartVote,
  onStartGame,
  onPlayTrack,
  onStopAudio,
  onStartQuestion,
  onNextQuestion,
  onNextRound,
  onOverrideAnswer,
  onSkipQuestion,
  onResetSoft,
  onBonus,
  onUndoScore,
  onSuspense,
  onOkFinale,
  onKickAll,
}: DashboardProps) {
  return (
    <div className="flex flex-col gap-4">
      <PerformanceAlert playerCount={playerCount} connected={connected} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Main controls - 3 cols */}
        <div className="lg:col-span-3">
          <GameControls
            gameState={gameState}
            onStartVote={onStartVote}
            onStartGame={onStartGame}
            onPlayTrack={onPlayTrack}
            onStopAudio={onStopAudio}
            onStartQuestion={onStartQuestion}
            onNextQuestion={onNextQuestion}
            onNextRound={onNextRound}
            onOverrideAnswer={onOverrideAnswer}
            onSkipQuestion={onSkipQuestion}
            onResetSoft={onResetSoft}
            onBonus={onBonus}
            onUndoScore={onUndoScore}
            onSuspense={onSuspense}
            onOkFinale={onOkFinale}
            onKickAll={onKickAll}
          />
        </div>

        {/* Scoreboard - 1 col */}
        <div>
          <ScoreWidget scores={gameState?.scores ?? []} />
        </div>
      </div>

      <ChatMonitor chatMessages={chatMessages} />
    </div>
  )
}
