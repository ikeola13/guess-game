"use client";

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
import Typography from "@mui/material/Typography";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CircleIcon from "@mui/icons-material/Circle";
import type { PublicRoomState } from "../../shared/protocol";
import { GUESS_CATEGORIES } from "@/lib/categories";
import { useState } from "react";

type WaitingRoomProps = {
  room: PublicRoomState;
  yourPlayerId: string;
  onStart: (categoryId: string) => void;
  onLeave: () => void;
};

export default function WaitingRoom({
  room,
  yourPlayerId,
  onStart,
  onLeave,
}: WaitingRoomProps) {
  const [categoryId, setCategoryId] = useState(GUESS_CATEGORIES[0].id);
  const isHost = room.hostId === yourPlayerId;
  const connectedCount = room.players.filter((p) => p.connected).length;
  const canStart = isHost && connectedCount >= 2;

  const selectedCategory =
    GUESS_CATEGORIES.find((c) => c.id === categoryId) ?? GUESS_CATEGORIES[0];

  const copyCode = async () => {
    await navigator.clipboard.writeText(room.code);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="overline" color="text.secondary">
            Room code
          </Typography>
          <Stack direction="row" spacing={1} sx={{ justifyContent: "center", alignItems: "center" }}>
            <Typography variant="h3" color="primary" sx={{ letterSpacing: 6, fontWeight: 700 }}>
              {room.code}
            </Typography>
            <Button size="small" startIcon={<ContentCopyIcon />} onClick={copyCode}>
              Copy
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Share this code with friends to join
          </Typography>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Players ({connectedCount}/{room.maxPlayers})
            </Typography>
            <Stack spacing={1}>
              {room.players.map((player) => (
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
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <CircleIcon
                      sx={{ fontSize: 12 }}
                      color={player.connected ? "success" : "disabled"}
                    />
                    <Typography sx={{ fontWeight: player.id === yourPlayerId ? 700 : 400 }}>
                      {player.name}
                      {player.id === yourPlayerId && " (you)"}
                    </Typography>
                  </Stack>
                  {player.id === room.hostId && (
                    <Chip label="Host" size="small" color="primary" />
                  )}
                </Box>
              ))}
            </Stack>
            {connectedCount < 2 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Waiting for at least 2 players...
              </Typography>
            )}
          </CardContent>
        </Card>

        {isHost && (
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6">Choose category</Typography>
                <FormControl fullWidth>
                  <InputLabel id="wait-category-label">Guess type</InputLabel>
                  <Select
                    labelId="wait-category-label"
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
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: "primary.light" }}>
                  <Typography variant="body2" color="primary.dark">
                    {selectedCategory.emoji} {selectedCategory.description}
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="large"
                  disabled={!canStart}
                  onClick={() => onStart(categoryId)}
                >
                  Start Game
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}

        {!isHost && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
            Waiting for the host to start the game...
          </Typography>
        )}

        <Button variant="text" color="secondary" onClick={onLeave}>
          Leave room
        </Button>
      </Stack>
    </Container>
  );
}
