"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import GroupsIcon from "@mui/icons-material/Groups";
import CategoryIcon from "@mui/icons-material/Category";
import { GUESS_CATEGORIES } from "@/lib/categories";
import type { GuessCategory } from "@/lib/categories";
import { MAX_PLAYERS, MIN_PLAYERS, getWinnersNeeded } from "../../shared/protocol";

type SetupScreenProps = {
  onStart: (playerCount: number, names: string[], category: GuessCategory) => void;
};

export default function SetupScreen({ onStart }: SetupScreenProps) {
  const [playerCount, setPlayerCount] = useState(2);
  const [names, setNames] = useState(["", ""]);
  const [categoryId, setCategoryId] = useState(GUESS_CATEGORIES[0].id);

  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
    setNames((prev) => {
      const next = [...prev];
      while (next.length < count) next.push("");
      return next.slice(0, count);
    });
  };

  const selectedCategory =
    GUESS_CATEGORIES.find((c) => c.id === categoryId) ?? GUESS_CATEGORIES[0];

  const canStart = names.every((name) => name.trim().length > 0);

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3} sx={{ alignItems: "center" }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h4" color="primary" gutterBottom>
            Guess Game
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Lock in your answer, then ask questions until someone wins.
          </Typography>
        </Box>

        <Card sx={{ width: "100%" }}>
          <CardContent>
            <Stack spacing={3}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <GroupsIcon color="primary" />
                <Typography variant="h6">Players</Typography>
              </Stack>

              <FormControl fullWidth>
                <InputLabel id="player-count-label">Number of players</InputLabel>
                <Select
                  labelId="player-count-label"
                  value={playerCount}
                  label="Number of players"
                  onChange={(e) => handlePlayerCountChange(Number(e.target.value))}
                >
                  {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => {
                    const count = i + MIN_PLAYERS;
                    const winners = getWinnersNeeded(count);
                    return (
                      <MenuItem key={count} value={count}>
                        {count} players — {winners} winner{winners === 1 ? "" : "s"}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>

              <Stack spacing={2}>
                {names.map((name, i) => (
                  <TextField
                    key={i}
                    label={`Player ${i + 1} name`}
                    value={name}
                    onChange={(e) => {
                      const next = [...names];
                      next[i] = e.target.value;
                      setNames(next);
                    }}
                    fullWidth
                    required
                  />
                ))}
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ width: "100%" }}>
          <CardContent>
            <Stack spacing={3}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <CategoryIcon color="primary" />
                <Typography variant="h6">Category</Typography>
              </Stack>

              <FormControl fullWidth>
                <InputLabel id="category-label">Guess type</InputLabel>
                <Select
                  labelId="category-label"
                  value={categoryId}
                  label="Guess type"
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {GUESS_CATEGORIES.map((cat) => (
                    <MenuItem key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "primary.light",
                  color: "primary.dark",
                }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                  <Typography variant="h5">{selectedCategory.emoji}</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {selectedCategory.label}
                  </Typography>
                </Stack>
                <Typography variant="body2">{selectedCategory.description}</Typography>
                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.5, mt: 1.5 }}>
                  {selectedCategory.items.slice(0, 5).map((item) => (
                    <Chip key={item} label={item} size="small" variant="outlined" />
                  ))}
                  <Chip label="..." size="small" variant="outlined" />
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={!canStart}
          onClick={() => onStart(playerCount, names, selectedCategory)}
          sx={{ maxWidth: 400 }}
        >
          Start Game
        </Button>
      </Stack>
    </Container>
  );
}
