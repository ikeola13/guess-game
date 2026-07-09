"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useSyncedCountdown } from "@/hooks/useSyncedCountdown";
import type { PublicQuizRoomState } from "../../../shared/quiz/protocol";

type QuizBreatherScreenProps = {
  room: PublicQuizRoomState;
  onLeave: () => void;
};

export default function QuizBreatherScreen({ room, onLeave }: QuizBreatherScreenProps) {
  const { secondsLeft } = useSyncedCountdown(room.breatherEndsAt);

  return (
    <Box sx={{ maxWidth: 480, mx: "auto", px: 2, py: 4 }}>
      <Stack spacing={4} sx={{ alignItems: "center", textAlign: "center" }}>
        <Typography variant="overline" color="text.secondary">
          Question {room.currentQuestionIndex + 1} of {room.questions.length}
        </Typography>

        <Card sx={{ width: "100%", bgcolor: "primary.light" }}>
          <CardContent>
            <Stack spacing={2} sx={{ alignItems: "center", py: 2 }}>
              <CircularProgress size={48} thickness={5} />
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Next question in {secondsLeft}s
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Get ready...
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Typography variant="body2" color="text.secondary">
          {room.topicEmoji} {room.topicLabel}
        </Typography>

        <Button variant="text" color="secondary" onClick={onLeave}>
          Leave session
        </Button>
      </Stack>
    </Box>
  );
}
