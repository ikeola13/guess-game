"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import type { PublicQuizRoomState } from "../../../shared/quiz/protocol";

type QuizFinishedScreenProps = {
  room: PublicQuizRoomState;
  yourPlayerId: string;
  onLeave: () => void;
};

export default function QuizFinishedScreen({
  room,
  yourPlayerId,
  onLeave,
}: QuizFinishedScreenProps) {
  const sorted = [...room.players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3} sx={{ alignItems: "center" }}>
        <EmojiEventsIcon sx={{ fontSize: 64, color: "warning.main" }} />
        <Typography variant="h4">Quiz complete!</Typography>
        {winner && (
          <Typography color="text.secondary">
            {winner.name} wins with {winner.score} points
          </Typography>
        )}

        <Card sx={{ width: "100%" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Final scores
            </Typography>
            <Stack spacing={1}>
              {sorted.map((player, index) => (
                <Box
                  key={player.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: index === 0 ? "success.light" : "background.default",
                  }}
                >
                  <Typography sx={{ fontWeight: player.id === yourPlayerId ? 700 : 400 }}>
                    #{index + 1} {player.name}
                  </Typography>
                  <Typography>{player.score} pts</Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Button variant="contained" onClick={onLeave}>
          Back to lobby
        </Button>
      </Stack>
    </Container>
  );
}
