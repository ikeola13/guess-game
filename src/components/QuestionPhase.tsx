"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HelpOutlinedIcon from "@mui/icons-material/HelpOutlined";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { isCorrectGuess } from "@/lib/categories";
import type { GuessCategory } from "@/lib/categories";
import type { Player } from "@/lib/game-types";

type QuestionPhaseProps = {
  players: Player[];
  category: GuessCategory;
  secretAnswer: string;
  currentAskerIndex: number;
  winnersNeeded: number;
  winnerCount: number;
  onNextAsker: () => void;
  onSubmitGuess: (playerId: string, guess: string, correct: boolean) => void;
  onRevealAnswer: () => void;
  isOnline?: boolean;
  myPlayerId?: string;
  serverGuessResult?: "correct" | "wrong" | null;
  onSubmitGuessOnline?: (guess: string) => void;
  onClearGuessResult?: () => void;
  isHost?: boolean;
  currentAskerId?: string | null;
};

export default function QuestionPhase({
  players,
  category,
  secretAnswer,
  currentAskerIndex,
  winnersNeeded,
  winnerCount,
  onNextAsker,
  onSubmitGuess,
  onRevealAnswer,
  isOnline = false,
  myPlayerId,
  serverGuessResult = null,
  onSubmitGuessOnline,
  onClearGuessResult,
  isHost = true,
  currentAskerId,
}: QuestionPhaseProps) {
  const [guessDialogOpen, setGuessDialogOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [finalGuess, setFinalGuess] = useState("");
  const [guessResult, setGuessResult] = useState<"correct" | "wrong" | null>(null);

  const activeGuessResult = isOnline ? serverGuessResult : guessResult;

  const activePlayers = players.filter((p) => !p.hasWon);
  const currentAsker = isOnline && currentAskerId
    ? players.find((p) => p.id === currentAskerId)
    : players[currentAskerIndex];
  const winners = players.filter((p) => p.hasWon).sort((a, b) => (a.finishOrder ?? 0) - (b.finishOrder ?? 0));

  const openGuessDialog = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setFinalGuess("");
    if (!isOnline) setGuessResult(null);
    onClearGuessResult?.();
    setGuessDialogOpen(true);
  };

  const handleSubmitGuess = () => {
    if (!selectedPlayerId || !finalGuess.trim()) return;
    if (isOnline && onSubmitGuessOnline) {
      onSubmitGuessOnline(finalGuess.trim());
      return;
    }
    const correct = isCorrectGuess(finalGuess, secretAnswer);
    setGuessResult(correct ? "correct" : "wrong");
    onSubmitGuess(selectedPlayerId, finalGuess.trim(), correct);
  };

  const closeGuessDialog = () => {
    setGuessDialogOpen(false);
    setSelectedPlayerId(null);
    setFinalGuess("");
    if (!isOnline) setGuessResult(null);
    onClearGuessResult?.();
  };

  return (
    <Box sx={{ maxWidth: 560, mx: "auto", px: 2, py: 4 }}>
      <Stack spacing={3}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Question Round
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ask each other questions out loud. First to guess correctly wins
            {winnersNeeded > 1 ? " — top 2 win with 3 players" : ""}.
          </Typography>
        </Box>

        <Card sx={{ bgcolor: "primary.light" }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <Typography variant="h4">{category.emoji}</Typography>
              <Box>
                <Typography variant="subtitle2" color="primary.dark">
                  Category
                </Typography>
                <Typography variant="h6" color="primary.dark">
                  {category.label}
                </Typography>
                <Typography variant="body2" color="primary.dark" sx={{ opacity: 0.8 }}>
                  {category.description}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <HelpOutlinedIcon color="primary" />
                <Typography variant="h6">Current turn</Typography>
              </Stack>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "background.default",
                  textAlign: "center",
                }}
              >
                <Typography variant="overline" color="text.secondary">
                  Asking questions
                </Typography>
                <Typography variant="h4" color="primary">
                  {currentAsker?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Ask a yes/no question to the group, then pass the turn.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<SkipNextIcon />}
                onClick={onNextAsker}
              >
                Next player&apos;s turn
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <EmojiEventsIcon color="primary" />
                  <Typography variant="h6">Players</Typography>
                </Stack>
                <Chip
                  label={`${winnerCount}/${winnersNeeded} winners`}
                  color={winnerCount >= winnersNeeded ? "success" : "default"}
                  size="small"
                />
              </Stack>

              <Stack spacing={1}>
                {players.map((player) => (
                  <Box
                    key={player.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: player.hasWon ? "success.light" : "background.default",
                      opacity: player.hasWon ? 0.85 : 1,
                    }}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      {player.hasWon && (
                        <CheckCircleIcon fontSize="small" color="success" />
                      )}
                      <Typography
                    sx={{ fontWeight: player.id === currentAsker?.id ? 700 : 400 }}
                    color={player.hasWon ? "success.dark" : "text.primary"}
                  >
                        {player.name}
                        {player.hasWon && player.finishOrder && (
                          <Typography component="span" variant="caption" sx={{ ml: 1 }}>
                            #{player.finishOrder}
                          </Typography>
                        )}
                      </Typography>
                    </Stack>
                    {!player.hasWon && winnerCount < winnersNeeded && (
                      (!isOnline || player.id === myPlayerId) && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => openGuessDialog(player.id)}
                        >
                          Final guess
                        </Button>
                      )
                    )}
                  </Box>
                ))}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {winners.length > 0 && (
          <Card sx={{ bgcolor: "success.light" }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }} color="success.dark">
                Winners so far
              </Typography>
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mt: 1 }}>
                {winners.map((w) => (
                  <Chip
                    key={w.id}
                    icon={<EmojiEventsIcon />}
                    label={`${w.name} (#${w.finishOrder})`}
                    color="success"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        {activePlayers.length > 0 && winnerCount < winnersNeeded && (
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
            Still playing: {activePlayers.map((p) => p.name).join(", ")}
          </Typography>
        )}

        <Divider />

        {(!isOnline || isHost) && (
          <Button variant="text" color="secondary" onClick={onRevealAnswer}>
            Reveal answer & end game
          </Button>
        )}
      </Stack>

      <Dialog open={guessDialogOpen} onClose={closeGuessDialog} fullWidth maxWidth="xs">
        <DialogTitle>
          {players.find((p) => p.id === selectedPlayerId)?.name}&apos;s final guess
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Enter your guess for the secret {category.label.toLowerCase()} answer.
            </Typography>
            <TextField
              label="Your guess"
              value={finalGuess}
              onChange={(e) => setFinalGuess(e.target.value)}
              fullWidth
              autoFocus
              disabled={activeGuessResult !== null}
            />
            {activeGuessResult === "correct" && (
              <Typography color="success.main" sx={{ fontWeight: 600 }}>
                Correct! You win!
              </Typography>
            )}
            {activeGuessResult === "wrong" && (
              <Typography color="error.main" sx={{ fontWeight: 600 }}>
                Wrong guess. Keep asking questions!
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeGuessDialog}>
            {activeGuessResult ? "Close" : "Cancel"}
          </Button>
          {activeGuessResult === null && (
            <Button
              variant="contained"
              onClick={handleSubmitGuess}
              disabled={!finalGuess.trim()}
            >
              Submit guess
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
