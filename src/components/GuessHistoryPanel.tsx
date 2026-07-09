"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import type { GuessAttempt } from "../../shared/protocol";

type GuessHistoryPanelProps = {
  guessHistory: GuessAttempt[];
  players: Array<{ id: string; name: string }>;
};

export default function GuessHistoryPanel({
  guessHistory,
  players,
}: GuessHistoryPanelProps) {
  const playerName = (id: string) => players.find((p) => p.id === id)?.name ?? "Unknown";

  const guessCounts = players.map((player) => ({
    player,
    count: guessHistory.filter((entry) => entry.guesserId === player.id).length,
  }));

  const sortedHistory = [...guessHistory].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <Card sx={{ width: "100%" }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <HistoryIcon color="primary" />
            <Typography variant="h6">Guess history</Typography>
            <Chip label={`${guessHistory.length} total`} size="small" />
          </Stack>

          {guessCounts.some(({ count }) => count > 0) ? (
            <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
              {guessCounts
                .filter(({ count }) => count > 0)
                .map(({ player, count }) => (
                  <Chip
                    key={player.id}
                    label={`${player.name}: ${count} guess${count === 1 ? "" : "es"}`}
                    size="small"
                    variant="outlined"
                  />
                ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No guesses yet.
            </Typography>
          )}

          {sortedHistory.length > 0 && (
            <Stack spacing={1}>
              {sortedHistory.map((entry, index) => (
                <Box
                  key={entry.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: entry.correct ? "success.light" : "background.default",
                  }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                    {entry.correct ? (
                      <CheckCircleIcon fontSize="small" color="success" sx={{ mt: 0.25 }} />
                    ) : (
                      <CloseIcon fontSize="small" color="error" sx={{ mt: 0.25 }} />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">
                        <strong>{playerName(entry.guesserId)}</strong> guessed{" "}
                        <strong>{playerName(entry.targetPlayerId)}</strong>&apos;s answer:{" "}
                        <strong>&quot;{entry.guess}&quot;</strong>
                      </Typography>
                      <Typography
                        variant="caption"
                        color={entry.correct ? "success.dark" : "error.main"}
                      >
                        {entry.correct ? "Correct" : "Wrong"} · Guess #
                        {guessHistory.length - index}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
