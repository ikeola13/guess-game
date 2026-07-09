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
import MenuItem from "@mui/material/MenuItem";
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
  currentAskerIndex: number;
  winnersNeeded: number;
  winnerCount: number;
  onNextAsker: () => void;
  onSubmitGuess: (guesserId: string, targetPlayerId: string, guess: string, correct: boolean) => void;
  onRevealAnswer: () => void;
  isOnline?: boolean;
  myPlayerId?: string;
  serverGuessResult?: "correct" | "wrong" | null;
  onSubmitGuessOnline?: (targetPlayerId: string, guess: string) => void;
  onClearGuessResult?: () => void;
  isHost?: boolean;
  currentAskerId?: string | null;
};

export default function QuestionPhase({
  players,
  category,
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
  const [targetPlayerId, setTargetPlayerId] = useState<string | null>(null);
  const [guesserId, setGuesserId] = useState<string | null>(null);
  const [finalGuess, setFinalGuess] = useState("");
  const [guessResult, setGuessResult] = useState<"correct" | "wrong" | null>(null);

  const activeGuessResult = isOnline ? serverGuessResult : guessResult;

  const activePlayers = players.filter((p) => !p.hasWon);
  const currentAsker = isOnline && currentAskerId
    ? players.find((p) => p.id === currentAskerId)
    : players[currentAskerIndex];
  const winners = players.filter((p) => p.hasWon).sort((a, b) => (a.finishOrder ?? 0) - (b.finishOrder ?? 0));

  const openGuessDialog = (targetId: string) => {
    setTargetPlayerId(targetId);
    setGuesserId(isOnline ? myPlayerId ?? null : currentAsker?.id ?? null);
    setFinalGuess("");
    if (!isOnline) setGuessResult(null);
    onClearGuessResult?.();
    setGuessDialogOpen(true);
  };

  const handleSubmitGuess = () => {
    if (!targetPlayerId || !finalGuess.trim()) return;

    if (isOnline && onSubmitGuessOnline) {
      onSubmitGuessOnline(targetPlayerId, finalGuess.trim());
      return;
    }

    const guesser = guesserId ?? currentAsker?.id;
    if (!guesser) return;

    const targetAnswer = players.find((p) => p.id === targetPlayerId)?.lockedGuess;
    const correct = targetAnswer ? isCorrectGuess(finalGuess, targetAnswer) : false;
    setGuessResult(correct ? "correct" : "wrong");
    onSubmitGuess(guesser, targetPlayerId, finalGuess.trim(), correct);
  };

  const closeGuessDialog = () => {
    setGuessDialogOpen(false);
    setTargetPlayerId(null);
    setGuesserId(null);
    setFinalGuess("");
    if (!isOnline) setGuessResult(null);
    onClearGuessResult?.();
  };

  const canGuessPlayer = (player: Player) => {
    if (player.hasWon || winnerCount >= winnersNeeded) return false;
    if (isOnline) return player.id !== myPlayerId;
    return true;
  };

  const targetPlayer = players.find((p) => p.id === targetPlayerId);

  return (
    <Box sx={{ maxWidth: 560, mx: "auto", px: 2, py: 4 }}>
      <Stack spacing={3}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Question Round
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Take turns asking each other questions about everyone&apos;s answers.
            First to guess someone&apos;s answer correctly wins
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
                  Ask a yes/no question about someone&apos;s answer, then pass the turn.
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
                        {player.id === myPlayerId && " (you)"}
                        {player.hasWon && player.finishOrder && (
                          <Typography component="span" variant="caption" sx={{ ml: 1 }}>
                            #{player.finishOrder}
                          </Typography>
                        )}
                      </Typography>
                    </Stack>
                    {canGuessPlayer(player) && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => openGuessDialog(player.id)}
                      >
                        Guess their answer
                      </Button>
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
            Reveal all answers & end game
          </Button>
        )}
      </Stack>

      <Dialog open={guessDialogOpen} onClose={closeGuessDialog} fullWidth maxWidth="xs">
        <DialogTitle>
          Guess {targetPlayer?.name}&apos;s answer
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              What do you think {targetPlayer?.name}&apos;s {category.label.toLowerCase()} answer is?
            </Typography>
            {!isOnline && (
              <TextField
                select
                label="Who is guessing?"
                value={guesserId ?? ""}
                onChange={(e) => setGuesserId(e.target.value)}
                fullWidth
                disabled={activeGuessResult !== null}
              >
                {activePlayers.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
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
              disabled={!finalGuess.trim() || (!isOnline && !guesserId)}
            >
              Submit guess
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
