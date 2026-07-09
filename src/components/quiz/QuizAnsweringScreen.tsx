"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TimerIcon from "@mui/icons-material/Timer";
import { useSyncedCountdown } from "@/hooks/useSyncedCountdown";
import { QUIZ_ROUND_MS } from "../../../shared/quiz/protocol";
import type { PublicQuizRoomState } from "../../../shared/quiz/protocol";

type QuizAnsweringScreenProps = {
  room: PublicQuizRoomState;
  yourPlayerId: string;
  onSubmitAnswer: (optionIndex: number) => void;
  onLeave: () => void;
  isSubmitting?: boolean;
  selectedIndex?: number | null;
};

export default function QuizAnsweringScreen({
  room,
  yourPlayerId,
  onSubmitAnswer,
  onLeave,
  isSubmitting = false,
  selectedIndex = null,
}: QuizAnsweringScreenProps) {
  const question = room.questions[room.currentQuestionIndex];
  const me = room.players.find((p) => p.id === yourPlayerId);
  const hasAnswered = (me?.hasAnswered ?? false) || selectedIndex != null;
  const { secondsLeft } = useSyncedCountdown(room.roundEndsAt);
  const progress = room.roundEndsAt ? (secondsLeft / (QUIZ_ROUND_MS / 1000)) * 100 : 0;
  const isUrgent = secondsLeft <= 3;

  return (
    <Box sx={{ maxWidth: 480, mx: "auto", px: 2, py: 4 }}>
      <Stack spacing={3}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="overline" color="text.secondary">
            Question {room.currentQuestionIndex + 1} of {room.questions.length}
          </Typography>
          <Typography variant="h5">Lock in your answer</Typography>
        </Box>

        <Card sx={{ bgcolor: isUrgent ? "warning.light" : "background.paper" }}>
          <CardContent>
            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                <TimerIcon fontSize="small" />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {secondsLeft}s
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Same timer for everyone
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={isUrgent ? "warning" : "primary"}
              sx={{ mt: 1.5, height: 8, borderRadius: 4 }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">{question.prompt}</Typography>
            </Stack>
          </CardContent>
        </Card>

        <Stack spacing={1}>
          {question.options.map((option, index) => (
            <Button
              key={index}
              variant={selectedIndex === index ? "contained" : "outlined"}
              size="large"
              fullWidth
              disabled={hasAnswered || isSubmitting || !room.roundEndsAt}
              onClick={() => onSubmitAnswer(index)}
              sx={{ justifyContent: "flex-start", textAlign: "left" }}
            >
              <strong style={{ marginRight: 8 }}>{String.fromCharCode(65 + index)}.</strong>
              {option}
            </Button>
          ))}
        </Stack>

        {hasAnswered && (
          <Typography variant="body2" color="success.main" sx={{ textAlign: "center", fontWeight: 600 }}>
            Answer locked in!
          </Typography>
        )}

        <Button variant="text" color="secondary" onClick={onLeave}>
          Leave session
        </Button>
      </Stack>
    </Box>
  );
}
