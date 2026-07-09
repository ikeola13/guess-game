"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ReplayIcon from "@mui/icons-material/Replay";
import type { GuessCategory } from "@/lib/categories";
import type { Player } from "@/lib/game-types";

type GameOverScreenProps = {
  players: Player[];
  category: GuessCategory;
  secretAnswer: string;
  onPlayAgain: () => void;
  isOnline?: boolean;
  isHost?: boolean;
};

export default function GameOverScreen({
  players,
  category,
  secretAnswer,
  onPlayAgain,
  isOnline = false,
  isHost = true,
}: GameOverScreenProps) {
  const winners = players
    .filter((p) => p.hasWon)
    .sort((a, b) => (a.finishOrder ?? 99) - (b.finishOrder ?? 99));

  return (
    <Box sx={{ maxWidth: 480, mx: "auto", px: 2, py: 4 }}>
      <Stack spacing={3} sx={{ alignItems: "center" }}>
        <EmojiEventsIcon sx={{ fontSize: 64, color: "warning.main" }} />

        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h4" gutterBottom>
            Game Over!
          </Typography>
          {winners.length > 0 ? (
            <Typography variant="body1" color="text.secondary">
              {winners.length === 1
                ? `${winners[0].name} takes the crown!`
                : `${winners.map((w) => w.name).join(" & ")} share the win!`}
            </Typography>
          ) : (
            <Typography variant="body1" color="text.secondary">
              Nobody guessed correctly this round.
            </Typography>
          )}
        </Box>

        <Card sx={{ width: "100%", bgcolor: "primary.light" }}>
          <CardContent>
            <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center" }}>
              <Typography variant="overline" color="primary.dark">
                The secret answer was
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography variant="h3">{category.emoji}</Typography>
                <Typography variant="h4" color="primary.dark" sx={{ fontWeight: 700 }}>
                  {secretAnswer}
                </Typography>
              </Stack>
              <Chip label={category.label} size="small" />
            </Stack>
          </CardContent>
        </Card>

        {winners.length > 0 && (
          <Card sx={{ width: "100%" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Winners
              </Typography>
              <Stack spacing={1}>
                {winners.map((winner) => (
                  <Box
                    key={winner.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: "success.light",
                    }}
                  >
                    <Typography sx={{ fontWeight: 600 }} color="success.dark">
                      #{winner.finishOrder} {winner.name}
                    </Typography>
                    {winner.lockedGuess && (
                      <Typography variant="body2" color="text.secondary">
                        Locked in: {winner.lockedGuess}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        <Card sx={{ width: "100%" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              All locked-in guesses
            </Typography>
            <Stack spacing={1}>
              {players.map((player) => (
                <Box
                  key={player.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "background.default",
                  }}
                >
                  <Typography sx={{ fontWeight: player.hasWon ? 700 : 400 }}>
                    {player.name}
                    {player.hasWon && " 🏆"}
                  </Typography>
                  <Typography color="text.secondary">
                    {player.lockedGuess ?? "—"}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {(!isOnline || isHost) ? (
          <Button
            variant="contained"
            size="large"
            startIcon={<ReplayIcon />}
            onClick={onPlayAgain}
            fullWidth
            sx={{ maxWidth: 320 }}
          >
            Play Again
          </Button>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
            Waiting for host to start a new round...
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
