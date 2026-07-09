"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import { useSyncedCountdown } from "@/hooks/useSyncedCountdown";
import type { PublicQuizRoomState } from "../../../shared/quiz/protocol";

type QuizRevealScreenProps = {
  room: PublicQuizRoomState;
  yourPlayerId: string;
  onLeave: () => void;
};

export default function QuizRevealScreen({ room, yourPlayerId, onLeave }: QuizRevealScreenProps) {
  const question = room.questions[room.currentQuestionIndex];
  const me = room.players.find((p) => p.id === yourPlayerId);
  const { secondsLeft } = useSyncedCountdown(room.revealEndsAt);

  const myAnswerIndex = me?.answeredIndex ?? null;
  const gotItRight = myAnswerIndex === question.correctIndex;

  return (
    <Box sx={{ maxWidth: 480, mx: "auto", px: 2, py: 4 }}>
      <Stack spacing={3}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="overline" color="text.secondary">
            Question {room.currentQuestionIndex + 1} reveal
          </Typography>
          <Typography variant="h5">Correct answer</Typography>
          {room.revealEndsAt && (
            <Typography variant="caption" color="text.secondary">
              Next question in {secondsLeft}s
            </Typography>
          )}
        </Box>

        <Card sx={{ bgcolor: "success.light" }}>
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="h6" color="success.dark">
                {String.fromCharCode(65 + question.correctIndex)}.{" "}
                {question.options[question.correctIndex]}
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {me && (
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                {myAnswerIndex != null ? (
                  gotItRight ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <CloseIcon color="error" />
                  )
                ) : (
                  <CloseIcon color="disabled" />
                )}
                <Typography>
                  {myAnswerIndex != null
                    ? `You answered: ${String.fromCharCode(65 + myAnswerIndex)}. ${question.options[myAnswerIndex]}`
                    : "You did not answer in time"}
                </Typography>
              </Stack>
              {myAnswerIndex != null && (
                <Chip
                  label={gotItRight ? "Correct! +1" : "Wrong"}
                  color={gotItRight ? "success" : "error"}
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Leaderboard
            </Typography>
            <Stack spacing={1}>
              {[...room.players]
                .sort((a, b) => b.score - a.score)
                .map((player) => (
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
                    <Typography sx={{ fontWeight: player.id === yourPlayerId ? 700 : 400 }}>
                      {player.name}
                    </Typography>
                    <Typography color="text.secondary">{player.score} pts</Typography>
                  </Box>
                ))}
            </Stack>
          </CardContent>
        </Card>

        <Button variant="text" color="secondary" onClick={onLeave}>
          Leave session
        </Button>
      </Stack>
    </Box>
  );
}
