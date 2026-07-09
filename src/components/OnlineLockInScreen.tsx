"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import LockIcon from "@mui/icons-material/Lock";
import TimerIcon from "@mui/icons-material/Timer";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { GuessCategory } from "@/lib/categories";
import type { PublicPlayer, PublicRoomState } from "../../shared/protocol";
import { LOCK_IN_MS } from "../../shared/protocol";

type OnlineLockInScreenProps = {
  room: PublicRoomState;
  category: GuessCategory;
  yourPlayerId: string;
  onLockIn: (guess: string) => void;
};

export default function OnlineLockInScreen({
  room,
  category,
  yourPlayerId,
  onLockIn,
}: OnlineLockInScreenProps) {
  const [guess, setGuess] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30);

  const me = room.players.find((p) => p.id === yourPlayerId);
  const hasLockedIn = me?.hasLockedIn ?? false;

  useEffect(() => {
    if (!room.lockInEndsAt) return;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((room.lockInEndsAt! - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [room.lockInEndsAt]);

  const progress = (secondsLeft / (LOCK_IN_MS / 1000)) * 100;
  const isUrgent = secondsLeft <= 10;
  const canLock = guess.trim().length > 0 && !hasLockedIn;

  if (hasLockedIn) {
    return (
      <Box sx={{ maxWidth: 480, mx: "auto", px: 2, py: 4 }}>
        <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
          <CheckCircleIcon sx={{ fontSize: 56, color: "success.main" }} />
          <Typography variant="h5">Guess locked in!</Typography>
          <Typography variant="body2" color="text.secondary">
            Waiting for other players...
          </Typography>
          <PlayerStatusList players={room.players} yourPlayerId={yourPlayerId} />
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 480, mx: "auto", px: 2, py: 4 }}>
      <Stack spacing={3}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Lock in your guess
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Everyone has 30 seconds. Your guess stays hidden from other players.
          </Typography>
        </Box>

        <Card>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: isUrgent ? "warning.light" : "background.paper" }}>
          <CardContent>
            <Stack spacing={1.5}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                  <TimerIcon fontSize="small" color={isUrgent ? "warning" : "action"} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }} color={isUrgent ? "warning.dark" : "text.primary"}>
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

        <PlayerStatusList players={room.players} yourPlayerId={yourPlayerId} />
      </Stack>
    </Box>
  );
}

function PlayerStatusList({
  players,
  yourPlayerId,
}: {
  players: PublicPlayer[];
  yourPlayerId: string;
}) {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>
          Player status
        </Typography>
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
          {players.map((p) => (
            <Chip
              key={p.id}
              label={`${p.name}${p.id === yourPlayerId ? " (you)" : ""}`}
              color={p.hasLockedIn ? "success" : "default"}
              variant={p.hasLockedIn ? "filled" : "outlined"}
              size="small"
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
