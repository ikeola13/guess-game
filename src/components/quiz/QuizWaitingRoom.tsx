"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import type { PublicQuizRoomState } from "../../../shared/quiz/protocol";

type QuizWaitingRoomProps = {
  room: PublicQuizRoomState;
  yourPlayerId: string;
  onStart: () => void;
  onLeave: () => void;
};

export default function QuizWaitingRoom({
  room,
  yourPlayerId,
  onStart,
  onLeave,
}: QuizWaitingRoomProps) {
  const isHost = room.hostId === yourPlayerId;
  const connectedCount = room.players.filter((p) => p.connected).length;

  const copyCode = async () => {
    await navigator.clipboard.writeText(room.code);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="overline" color="text.secondary">
            {room.topicEmoji} {room.topicLabel}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ justifyContent: "center", alignItems: "center" }}>
            <Typography variant="h3" color="primary" sx={{ letterSpacing: 6, fontWeight: 700 }}>
              {room.code}
            </Typography>
            <Button size="small" startIcon={<ContentCopyIcon />} onClick={copyCode}>
              Copy
            </Button>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {room.questions.length} questions · up to {room.maxPlayers} players
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
                    justifyContent: "space-between",
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: "background.default",
                  }}
                >
                  <Typography sx={{ fontWeight: player.id === yourPlayerId ? 700 : 400 }}>
                    {player.name}
                    {player.id === yourPlayerId && " (you)"}
                  </Typography>
                  {player.id === room.hostId && <Chip label="Host" size="small" color="primary" />}
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {isHost ? (
          <Button variant="contained" size="large" disabled={connectedCount < 2} onClick={onStart}>
            Start quiz
          </Button>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
            Waiting for host to start...
          </Typography>
        )}

        <Button variant="text" color="secondary" onClick={onLeave}>
          Leave session
        </Button>
      </Stack>
    </Container>
  );
}
