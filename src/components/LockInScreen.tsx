"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import LockIcon from "@mui/icons-material/Lock";
import TimerIcon from "@mui/icons-material/Timer";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import type { GuessCategory } from "@/lib/categories";
import type { Player } from "@/lib/game-types";

const LOCK_IN_SECONDS = 30;

type LockInScreenProps = {
  player: Player;
  playerIndex: number;
  totalPlayers: number;
  category: GuessCategory;
  onLockIn: (guess: string) => void;
  onTimeUp: () => void;
};

export default function LockInScreen({
  player,
  playerIndex,
  totalPlayers,
  category,
  onLockIn,
  onTimeUp,
}: LockInScreenProps) {
  const [guess, setGuess] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(LOCK_IN_SECONDS);
  const [handoffReady, setHandoffReady] = useState(false);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!handoffReady) return;

    if (secondsLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [handoffReady, secondsLeft, onTimeUp]);

  const progress = (secondsLeft / LOCK_IN_SECONDS) * 100;
  const isUrgent = secondsLeft <= 10;
  const canLock = guess.trim().length > 0;

  if (!handoffReady) {
    return (
      <Box
        sx={{
          minHeight: "70vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
        }}
      >
        <Card sx={{ maxWidth: 420, width: "100%" }}>
          <CardContent>
            <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
              <VisibilityOffIcon sx={{ fontSize: 48, color: "primary.main" }} />
              <Typography variant="h5">Pass the device</Typography>
              <Typography variant="body1" color="text.secondary">
                Hand the phone to{" "}
                <strong>{player.name}</strong>. Nobody else should look at the
                screen.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Player {playerIndex + 1} of {totalPlayers}
              </Typography>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={() => setHandoffReady(true)}
              >
                I&apos;m {player.name} — ready
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 480, mx: "auto", px: 2, py: 4 }}>
      <Stack spacing={3}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="overline" color="text.secondary">
            Player {playerIndex + 1} of {totalPlayers}
          </Typography>
          <Typography variant="h5" gutterBottom>
            {player.name}, lock in your guess
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You have 30 seconds. Your guess stays hidden from other players.
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography variant="h4">{category.emoji}</Typography>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {category.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {category.description}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card
          sx={{
            bgcolor: isUrgent ? "warning.light" : "background.paper",
            transition: "background-color 0.3s",
          }}
        >
          <CardContent>
            <Stack spacing={1.5}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                  <TimerIcon fontSize="small" color={isUrgent ? "warning" : "action"} />
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700 }}
                    color={isUrgent ? "warning.dark" : "text.primary"}
                  >
                    {secondsLeft}s
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  Time remaining
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={progress}
                color={isUrgent ? "warning" : "primary"}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Stack>
          </CardContent>
        </Card>

        <TextField
          label={`Your guess (${category.label})`}
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          fullWidth
          autoFocus
          placeholder={
            category.id === "number" ? "e.g. 42" : `Enter a ${category.label.toLowerCase()}...`
          }
          type={revealed ? "text" : "password"}
          slotProps={{
            input: {
              endAdornment: (
                <Button size="small" onClick={() => setRevealed((r) => !r)}>
                  {revealed ? "Hide" : "Show"}
                </Button>
              ),
            },
          }}
        />

        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={!canLock}
          startIcon={<LockIcon />}
          onClick={() => onLockIn(guess.trim())}
        >
          Lock In Answer
        </Button>
      </Stack>
    </Box>
  );
}
