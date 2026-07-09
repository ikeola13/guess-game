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
import type { PublicQuizRoomState } from "../../../shared/quiz/protocol";

type QuizRoundReadyScreenProps = {
  room: PublicQuizRoomState;
  yourPlayerId: string;
  isHost: boolean;
  onMarkReady: () => void;
  onStartRound: () => void;
  onLeave: () => void;
  isMarkingReady?: boolean;
};

export default function QuizRoundReadyScreen({
  room,
  yourPlayerId,
  isHost,
  onMarkReady,
  onStartRound,
  onLeave,
  isMarkingReady = false,
}: QuizRoundReadyScreenProps) {
  const question = room.questions[room.currentQuestionIndex];
  const me = room.players.find((p) => p.id === yourPlayerId);
  const connectedPlayers = room.players.filter((p) => p.connected);
  const readyCount = connectedPlayers.filter((p) => p.isReady).length;
  const isReady = (me?.isReady ?? false) || isMarkingReady;

  return (
    <Box sx={{ maxWidth: 480, mx: "auto", px: 2, py: 4 }}>
      <Stack spacing={3}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="overline" color="text.secondary">
            Question {room.currentQuestionIndex + 1} of {room.questions.length}
          </Typography>
          <Typography variant="h5" gutterBottom>
            Get ready
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Everyone taps Ready. The 10-second timer starts together for all players.
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
              <Typography variant="h6" color="text.secondary">
                🤫 Question hidden until everyone is ready
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {question.options.length} answer choices will appear when the timer starts.
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack direction="row" sx={{ justifyContent: "space-between", mb: 1 }}>
              <Typography variant="subtitle2">Ready check</Typography>
              <Chip label={`${readyCount}/${connectedPlayers.length} ready`} size="small" />
            </Stack>
            <Stack spacing={1}>
              {connectedPlayers.map((player) => (
                <Box
                  key={player.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    p: 1.25,
                    borderRadius: 2,
                    bgcolor: "background.default",
                  }}
                >
                  <Typography>{player.name}{player.id === yourPlayerId && " (you)"}</Typography>
                  <Chip
                    label={player.isReady ? "Ready" : "Waiting"}
                    size="small"
                    color={player.isReady ? "success" : "default"}
                    variant={player.isReady ? "filled" : "outlined"}
                  />
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {!isReady ? (
          <Button variant="contained" size="large" onClick={onMarkReady} disabled={isMarkingReady}>
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
              </Stack>
            </CardContent>
          </Card>
        )}

        {isHost && (
          <Button variant="outlined" fullWidth startIcon={<PlayArrowIcon />} onClick={onStartRound}>
            Start 10-second timer now
          </Button>
        )}

        <Button variant="text" color="secondary" onClick={onLeave}>
          Leave session
        </Button>
      </Stack>
    </Box>
  );
}
