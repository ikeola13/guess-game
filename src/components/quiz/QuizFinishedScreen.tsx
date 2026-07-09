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
  const topScore = sorted[0]?.score ?? 0;
  const winners = sorted.filter((p) => p.score === topScore);
  const isTie = winners.length > 1;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3} sx={{ alignItems: "center" }}>
        <EmojiEventsIcon sx={{ fontSize: 64, color: "warning.main" }} />
        <Typography variant="h4">Quiz complete!</Typography>
        {isTie ? (
          <Typography color="text.secondary">
            It&apos;s a tie! {winners.length} players share the top with {topScore} points
          </Typography>
        ) : winners[0] ? (
          <Typography color="text.secondary">
            {winners[0].name} wins with {topScore} points
          </Typography>
        ) : null}

        <Card sx={{ width: "100%" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Final scores
            </Typography>
            <Stack spacing={1}>
              {sorted.map((player, index) => {
                const isWinner = !isTie && index === 0;
                const isTied = isTie && player.score === topScore;
                return (
                  <Box
                    key={player.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: isWinner ? "success.light" : isTied ? "warning.light" : "background.default",
                    }}
                  >
                    <Typography sx={{ fontWeight: player.id === yourPlayerId ? 700 : 400 }}>
                      #{index + 1} {player.name}
                    </Typography>
                    <Typography>{player.score} pts</Typography>
                  </Box>
                );
              })}
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
