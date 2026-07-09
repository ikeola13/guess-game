"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import QuizIcon from "@mui/icons-material/Quiz";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import { useQuizTopics } from "@/hooks/useQuizTopics";
import { getPlayerName, savePlayerName } from "@/lib/storage";

type QuizHostSetupScreenProps = {
  onBack: () => void;
  onCreate: (hostName: string, topicId: string, questionCount: number) => void;
  isCreating?: boolean;
  error?: string | null;
};

export default function QuizHostSetupScreen({
  onBack,
  onCreate,
  isCreating = false,
  error,
}: QuizHostSetupScreenProps) {
  const { topics, loading, error: topicsError } = useQuizTopics();
  const [hostName, setHostName] = useState(getPlayerName());
  const [topicId, setTopicId] = useState("");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!topicId && topics[0]) {
      setTopicId(topics[0].id);
      setQuestionCount(topics[0].questions.length);
    }
  }, [topics, topicId]);

  const selectedTopic = topics.find((topic) => topic.id === topicId) ?? topics[0];
  const maxQuestions = selectedTopic?.questions.length ?? 1;

  useEffect(() => {
    if (questionCount > maxQuestions) {
      setQuestionCount(maxQuestions);
    }
  }, [maxQuestions, questionCount]);

  const handleCreate = () => {
    if (!hostName.trim()) {
      setValidationError("Enter your name");
      return;
    }
    if (!selectedTopic) {
      setValidationError("Add a category in the question bank first");
      return;
    }
    setValidationError(null);
    savePlayerName(hostName);
    onCreate(hostName.trim(), selectedTopic.id, questionCount);
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <CircularProgress />
          <Typography color="text.secondary">Loading categories...</Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 3, pb: 6 }}>
      <Stack spacing={2}>
        <Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5 }}>
            <QuizIcon color="primary" />
            <Typography variant="h5" color="primary">
              Host a quiz
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Pick a category from the question bank and choose how many questions to play.
          </Typography>
        </Box>

        <Button
          component={Link}
          href="/quiz-bank"
          variant="outlined"
          startIcon={<LibraryBooksIcon />}
        >
          Manage question bank
        </Button>

        <TextField
          label="Your name (host)"
          value={hostName}
          onChange={(e) => setHostName(e.target.value)}
          fullWidth
        />

        {(validationError || error || topicsError) && (
          <Alert severity="error">{validationError || error || topicsError}</Alert>
        )}

        {topics.length === 0 ? (
          <Alert severity="info">
            No categories available.{" "}
            <Link href="/quiz-bank" style={{ color: "inherit", fontWeight: 600 }}>
              Add categories in the question bank
            </Link>
            .
          </Alert>
        ) : (
          <>
            <Typography variant="subtitle2" color="text.secondary">
              Choose a category
            </Typography>

            <Stack spacing={1.5}>
              {topics.map((topic) => {
                const selected = topic.id === topicId;
                return (
                  <Card
                    key={topic.id}
                    variant="outlined"
                    sx={{
                      borderColor: selected ? "primary.main" : "divider",
                      bgcolor: selected ? "action.selected" : "background.paper",
                    }}
                  >
                    <CardActionArea onClick={() => { setTopicId(topic.id); setQuestionCount(topic.questions.length); }} disabled={isCreating}>
                      <CardContent>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                          <Typography sx={{ fontSize: "1.75rem", lineHeight: 1 }}>{topic.emoji}</Typography>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 0.5, flexWrap: "wrap" }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {topic.label}
                              </Typography>
                              {selected && <Chip label="Selected" size="small" color="primary" />}
                              {topic.builtin ? (
                                <Chip label="Built-in" size="small" variant="outlined" />
                              ) : (
                                <Chip label="Custom" size="small" variant="outlined" />
                              )}
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              {topic.description}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mt: 0.5, display: "block" }}
                            >
                              {topic.questions.length} questions
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                );
              })}
            </Stack>

            {selectedTopic && (
              <>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Number of questions
                    </Typography>
                    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                      <Slider
                        value={questionCount}
                        onChange={(_, val) => setQuestionCount(val as number)}
                        min={1}
                        max={maxQuestions}
                        step={1}
                        marks={maxQuestions <= 20 ? Array.from({ length: maxQuestions }, (_, i) => ({ value: i + 1, label: i + 1 === 1 || i + 1 === maxQuestions || i + 1 === questionCount ? String(i + 1) : "" })) : undefined}
                        valueLabelDisplay="auto"
                        disabled={isCreating || maxQuestions <= 1}
                        sx={{ flex: 1 }}
                      />
                      <Typography variant="h6" sx={{ fontWeight: 600, minWidth: 48, textAlign: "center" }}>
                        {questionCount}/{maxQuestions}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Preview
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {selectedTopic.emoji} {selectedTopic.label} — first question:
                    </Typography>
                    <Typography variant="body1">{selectedTopic.questions[0]?.prompt}</Typography>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={onBack} disabled={isCreating}>
            Back
          </Button>
          <Button
            variant="contained"
            fullWidth
            onClick={handleCreate}
            disabled={isCreating || !selectedTopic}
          >
            {isCreating ? "Creating..." : `Start ${selectedTopic?.label ?? "quiz"} (${questionCount} Q)`}
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
