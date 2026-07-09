"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import type { GuessCategory } from "@/lib/categories";
import type { PublicRoomState } from "../../shared/protocol";

type OnlineLockInReadyScreenProps = {
  room: PublicRoomState;
  category: GuessCategory;
  yourPlayerId: string;
  isHost: boolean;
  onMarkReady: () => void;
  onStartLockIn: () => void;
  onLeave: () => void;
  isMarkingReady?: boolean;
};

export default function OnlineLockInReadyScreen({
  room,
  category,
  yourPlayerId,
  isHost,
  onMarkReady,
  onStartLockIn,
  onLeave,
  isMarkingReady = false,
}: OnlineLockInReadyScreenProps) {
  const me = room.players.find((p) => p.id === yourPlayerId);
  const connectedPlayers = room.players.filter((p) => p.connected);
  const readyCount = connectedPlayers.filter((p) => p.isReadyForLockIn).length;
  const isReady = (me?.isReadyForLockIn ?? false) || isMarkingReady;

  return (
    <Box sx={{ maxWidth: 480, mx: "auto", px: 2, py: 4 }}>
      <Stack spacing={3}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h5" gutterBottom>
            Get ready
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Everyone taps Ready first. The 30-second lock-in timer starts together
            once all players are ready, or when the host starts it.
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

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="h6">Ready check</Typography>
                <Chip
                  label={`${readyCount}/${connectedPlayers.length} ready`}
                  color={readyCount === connectedPlayers.length ? "success" : "default"}
                  size="small"
                />
              </Stack>

              <Stack spacing={1}>
                {connectedPlayers.map((player) => (
                  <Box
                    key={player.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "background.default",
                    }}
                  >
                    <Typography sx={{ fontWeight: player.id === yourPlayerId ? 700 : 400 }}>
                      {player.name}
                      {player.id === yourPlayerId && " (you)"}
                    </Typography>
                    <Chip
                      label={player.isReadyForLockIn ? "Ready" : "Waiting"}
                      color={player.isReadyForLockIn ? "success" : "default"}
                      size="small"
                      variant={player.isReadyForLockIn ? "filled" : "outlined"}
                    />
                  </Box>
                ))}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {!isReady ? (
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={onMarkReady}
            disabled={isMarkingReady}
          >
            {isMarkingReady ? "Marking ready..." : "I'm ready"}
          </Button>
        ) : (
          <Card sx={{ bgcolor: "success.light" }}>
            <CardContent>
              <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center" }}>
                <CheckCircleIcon color="success" />
                <Typography color="success.dark" sx={{ fontWeight: 600 }}>
                  You&apos;re ready
                </Typography>
                <Typography variant="body2" color="success.dark">
                  Waiting for {readyCount < connectedPlayers.length
                    ? `${connectedPlayers.length - readyCount} more player${connectedPlayers.length - readyCount === 1 ? "" : "s"}`
                    : "the timer to start"}...
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        )}

        {isHost && (
          <Button
            variant="outlined"
            size="large"
            fullWidth
            startIcon={<PlayArrowIcon />}
            onClick={onStartLockIn}
            disabled={connectedPlayers.length < 2}
          >
            Start lock-in now
          </Button>
        )}

        <Button variant="text" color="secondary" onClick={onLeave}>
          Leave room
        </Button>
      </Stack>
    </Box>
  );
}
