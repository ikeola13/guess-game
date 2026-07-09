"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import WifiIcon from "@mui/icons-material/Wifi";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import { getPlayerName, savePlayerName } from "@/lib/storage";
import { MAX_PLAYERS, MIN_PLAYERS } from "../../shared/protocol";

type LobbyScreenProps = {
  connectionStatus: "connecting" | "connected" | "disconnected";
  error: string | null;
  onPlayLocal: () => void;
  onCreateRoom: (name: string, maxPlayers: number) => void;
  onJoinRoom: (name: string, roomCode: string) => void;
};

export default function LobbyScreen({
  connectionStatus,
  error,
  onPlayLocal,
  onCreateRoom,
  onJoinRoom,
}: LobbyScreenProps) {
  const [tab, setTab] = useState(0);
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(2);

  useEffect(() => {
    const saved = getPlayerName();
    if (saved) setName(saved);
  }, []);

  const canProceed = name.trim().length > 0 && connectionStatus === "connected";

  const handleCreate = () => {
    savePlayerName(name);
    onCreateRoom(name.trim(), maxPlayers);
  };

  const handleJoin = () => {
    savePlayerName(name);
    onJoinRoom(name.trim(), roomCode.trim().toUpperCase());
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={3} sx={{ alignItems: "center" }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h4" color="primary" gutterBottom>
            Guess Game
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Play locally on one device or online with friends.
          </Typography>
        </Box>

        {connectionStatus !== "connected" && (
          <Alert severity="warning" sx={{ width: "100%" }}>
            {connectionStatus === "connecting"
              ? "Connecting to Firebase..."
              : "Not connected. Check your Firebase configuration."}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ width: "100%" }}>
            {error}
          </Alert>
        )}

        <Card sx={{ width: "100%" }}>
          <CardContent>
            <Stack spacing={3}>
              <TextField
                label="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
                helperText="Saved in localStorage for next time"
              />

              <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth">
                <Tab icon={<WifiIcon />} iconPosition="start" label="Online" />
                <Tab icon={<PhoneAndroidIcon />} iconPosition="start" label="Local" />
              </Tabs>

              {tab === 0 && (
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Create a room
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel id="max-players-label">Max players</InputLabel>
                      <Select
                        labelId="max-players-label"
                        value={maxPlayers}
                        label="Max players"
                        onChange={(e) => setMaxPlayers(Number(e.target.value))}
                      >
                        {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => {
                          const count = i + MIN_PLAYERS;
                          return (
                            <MenuItem key={count} value={count}>
                              {count} players
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      fullWidth
                      sx={{ mt: 2 }}
                      disabled={!canProceed}
                      onClick={handleCreate}
                    >
                      Create Room
                    </Button>
                  </Box>

                  <Divider>or</Divider>

                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Join a room
                    </Typography>
                    <TextField
                      label="Room code"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      fullWidth
                      placeholder="ABCDE"
                      slotProps={{
                        htmlInput: {
                          maxLength: 5,
                          style: { letterSpacing: 4, textTransform: "uppercase" },
                        },
                      }}
                    />
                    <Button
                      variant="outlined"
                      fullWidth
                      sx={{ mt: 2 }}
                      disabled={!canProceed || roomCode.trim().length < 4}
                      onClick={handleJoin}
                    >
                      Join Room
                    </Button>
                  </Box>
                </Stack>
              )}

              {tab === 1 && (
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    Pass-and-play on a single device. No server needed.
                  </Typography>
                  <Button variant="contained" fullWidth onClick={onPlayLocal}>
                    Start Local Game
                  </Button>
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
