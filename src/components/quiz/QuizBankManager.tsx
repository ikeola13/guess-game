"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { createEmptyCustomTopic, validateQuizTopicData } from "../../../shared/quiz/data-bank";
import type { QuizTopic } from "../../../shared/quiz/data-bank";
import type { QuizQuestion } from "../../../shared/quiz/protocol";
import { QUIZ_IMPORT_EXAMPLE, parseQuizImportJson } from "../../../shared/quiz/import";
import { QUIZ_QUESTION_COUNT } from "../../../shared/quiz/protocol";
import { useQuizTopics } from "@/hooks/useQuizTopics";

function isCustomTopic(topic: QuizTopic): boolean {
  return !topic.builtin;
}

function downloadTopicJson(topic: QuizTopic) {
  const payload = {
    label: topic.label,
    emoji: topic.emoji,
    description: topic.description,
    questions: topic.questions.map((question) => ({
      question: question.prompt,
      options: question.options,
      correctIndex: question.correctIndex,
    })),
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${topic.label.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "quiz-topic"}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function QuizBankManager() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    topics,
    builtinTopics,
    customTopics,
    loading,
    error,
    saving,
    saveTopic,
    deleteTopic,
    importTopics,
  } = useQuizTopics();

  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<QuizTopic | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId && topics[0]) {
      setSelectedId(topics[0].id);
    }
  }, [topics, selectedId]);

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === selectedId) ?? topics[0],
    [topics, selectedId],
  );

  const editingCustom = draft ? isCustomTopic(draft) : selectedTopic ? isCustomTopic(selectedTopic) : false;
  const activeTopic = draft ?? selectedTopic ?? null;
  const isDirty = draft != null;

  const selectTopic = (topic: QuizTopic) => {
    setSelectedId(topic.id);
    setDraft(null);
    setSaveError(null);
    setSaveMessage(null);
  };

  const startNewCategory = () => {
    const topic = createEmptyCustomTopic();
    setSelectedId(topic.id);
    setDraft(topic);
    setSaveError(null);
    setSaveMessage(null);
  };

  const updateDraft = (patch: Partial<QuizTopic>) => {
    const base = draft ?? selectedTopic;
    if (!base || !isCustomTopic(base)) return;
    setDraft({ ...base, ...patch });
    setSaveError(null);
    setSaveMessage(null);
  };

  const updateQuestion = (index: number, patch: Partial<QuizQuestion>) => {
    const base = draft ?? selectedTopic;
    if (!base || !isCustomTopic(base)) return;

    const questions = base.questions.map((question, i) =>
      i === index ? { ...question, ...patch } : question,
    );
    setDraft({ ...base, questions });
    setSaveError(null);
    setSaveMessage(null);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const base = draft ?? selectedTopic;
    if (!base || !isCustomTopic(base)) return;

    const questions = base.questions.map((question, i) => {
      if (i !== questionIndex) return question;
      const options = [...question.options] as [string, string, string, string];
      options[optionIndex] = value;
      return { ...question, options };
    });
    setDraft({ ...base, questions });
    setSaveError(null);
    setSaveMessage(null);
  };

  const handleSave = async () => {
    if (!activeTopic || !isCustomTopic(activeTopic)) return;

    const validationError = validateQuizTopicData(activeTopic);
    if (validationError) {
      setSaveError(validationError);
      setSaveMessage(null);
      return;
    }

    try {
      await saveTopic(activeTopic);
      setDraft(null);
      setSelectedId(activeTopic.id);
      setSaveError(null);
      setSaveMessage(`Saved "${activeTopic.label}"`);
    } catch {
      // error surfaced by hook
    }
  };

  const handleDelete = async () => {
    if (!activeTopic || !isCustomTopic(activeTopic) || draft) {
      if (draft) {
        setDraft(null);
        setSelectedId(topics[0]?.id ?? "");
      }
      return;
    }

    try {
      await deleteTopic(activeTopic.id);
      setDraft(null);
      setSelectedId(topics.find((topic) => topic.id !== activeTopic.id)?.id ?? "");
      setSaveMessage(`Deleted "${activeTopic.label}"`);
      setSaveError(null);
    } catch {
      // error surfaced by hook
    }
  };

  const handleImport = async () => {
    setImportError(null);
    setImportMessage(null);

    const { topics: importedTopics, error: parseError } = parseQuizImportJson(
      importJson,
      topics.map((topic) => topic.id),
    );

    if (parseError || importedTopics.length === 0) {
      setImportError(parseError ?? "No topics found in JSON");
      return;
    }

    try {
      await importTopics(importedTopics);
      setImportJson("");
      selectTopic(importedTopics[0]);
      setImportMessage(
        importedTopics.length === 1
          ? `Imported "${importedTopics[0].label}"`
          : `Imported ${importedTopics.length} categories`,
      );
    } catch {
      // error surfaced by hook
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImportJson(await file.text());
      setImportError(null);
      setImportMessage(`Loaded ${file.name}`);
    } catch {
      setImportError("Could not read that file");
    } finally {
      event.target.value = "";
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <CircularProgress />
          <Typography color="text.secondary">Loading question bank...</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="sticky"
        elevation={0}
        color="transparent"
        sx={{ bgcolor: "background.paper", borderBottom: 1, borderColor: "divider" }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 52, px: 1.5, gap: 1 }}>
          <IconButton
            component={Link}
            href="/"
            size="small"
            edge="start"
            aria-label="Back to home"
            sx={{ color: "text.secondary", ml: -0.5 }}
          >
            <ArrowBackIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
              Quiz question bank
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              Stored in Firestore
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 3, pb: 6 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h5" color="primary" gutterBottom>
              Categories
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Categories and questions are stored in Firestore and shared across all devices.
              Built-in categories are read-only.
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}

          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={startNewCategory} disabled={saving}>
              New category
            </Button>
            <Button variant="outlined" onClick={() => setImportOpen((open) => !open)} disabled={saving}>
              {importOpen ? "Hide import" : "Import JSON"}
            </Button>
          </Stack>

          <Collapse in={importOpen}>
            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1.5}>
                  <TextField
                    label="Quiz JSON"
                    value={importJson}
                    onChange={(e) => setImportJson(e.target.value)}
                    fullWidth
                    multiline
                    minRows={6}
                    slotProps={{
                      input: { sx: { fontFamily: "monospace", fontSize: "0.8rem" } },
                    }}
                  />
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    <Button
                      variant="outlined"
                      startIcon={<UploadFileIcon />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={saving}
                    >
                      Upload JSON
                    </Button>
                    <Button
                      variant="text"
                      onClick={() => setImportJson(JSON.stringify(QUIZ_IMPORT_EXAMPLE, null, 2))}
                    >
                      Load example
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => void handleImport()}
                      disabled={!importJson.trim() || saving}
                    >
                      Import
                    </Button>
                  </Stack>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    hidden
                    onChange={handleFileChange}
                  />
                  {importError && <Alert severity="error">{importError}</Alert>}
                  {importMessage && <Alert severity="success">{importMessage}</Alert>}
                </Stack>
              </CardContent>
            </Card>
          </Collapse>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Built-in
            </Typography>
            <Stack spacing={1}>
              {builtinTopics.map((topic) => (
                <Card
                  key={topic.id}
                  variant="outlined"
                  sx={{
                    borderColor: selectedId === topic.id && !draft ? "primary.main" : "divider",
                    bgcolor: selectedId === topic.id && !draft ? "action.selected" : "background.paper",
                  }}
                >
                  <CardActionArea onClick={() => selectTopic(topic)}>
                    <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                        <Typography sx={{ fontSize: "1.5rem" }}>{topic.emoji}</Typography>
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 600 }}>{topic.label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {topic.questions.length} questions
                          </Typography>
                        </Box>
                        <Chip label="Built-in" size="small" variant="outlined" />
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Custom
            </Typography>
            {customTopics.length === 0 ? (
              <Alert severity="info">No custom categories yet. Create one or import JSON.</Alert>
            ) : (
              <Stack spacing={1}>
                {customTopics.map((topic) => (
                  <Card
                    key={topic.id}
                    variant="outlined"
                    sx={{
                      borderColor:
                        selectedId === topic.id || draft?.id === topic.id ? "primary.main" : "divider",
                      bgcolor:
                        selectedId === topic.id || draft?.id === topic.id
                          ? "action.selected"
                          : "background.paper",
                    }}
                  >
                    <CardActionArea onClick={() => selectTopic(topic)}>
                      <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                          <Typography sx={{ fontSize: "1.5rem" }}>{topic.emoji}</Typography>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 600 }}>{topic.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {topic.questions.length} questions
                            </Typography>
                          </Box>
                          <Chip label="Custom" size="small" color="primary" variant="outlined" />
                        </Stack>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>

          <Divider />

          {activeTopic ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="h6">
                  {activeTopic.emoji} {activeTopic.label}
                </Typography>
                {!editingCustom && <Chip label="Read-only" size="small" />}
                {isDirty && <Chip label="Unsaved changes" size="small" color="warning" />}
              </Stack>

              {saveError && <Alert severity="error">{saveError}</Alert>}
              {saveMessage && <Alert severity="success">{saveMessage}</Alert>}

              {!editingCustom && (
                <Alert severity="info">
                  Built-in categories cannot be edited. Export as JSON and import as a custom category,
                  or create your own.
                </Alert>
              )}

              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    <TextField
                      label="Category name"
                      value={activeTopic.label}
                      onChange={(e) => updateDraft({ label: e.target.value })}
                      fullWidth
                      disabled={!editingCustom || saving}
                    />
                    <TextField
                      label="Emoji"
                      value={activeTopic.emoji}
                      onChange={(e) => updateDraft({ emoji: e.target.value })}
                      fullWidth
                      disabled={!editingCustom || saving}
                      helperText="Single emoji shown in the quiz lobby"
                    />
                    <TextField
                      label="Description"
                      value={activeTopic.description}
                      onChange={(e) => updateDraft({ description: e.target.value })}
                      fullWidth
                      multiline
                      minRows={2}
                      disabled={!editingCustom || saving}
                    />
                  </Stack>
                </CardContent>
              </Card>

              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Questions ({QUIZ_QUESTION_COUNT})
              </Typography>

              {activeTopic.questions.map((question, index) => (
                <Accordion key={question.id} defaultExpanded={index === 0} disableGutters>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 600 }}>
                      Q{index + 1}
                      {question.prompt
                        ? `: ${question.prompt.slice(0, 48)}${question.prompt.length > 48 ? "…" : ""}`
                        : ""}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={2}>
                      <TextField
                        label="Question"
                        value={question.prompt}
                        onChange={(e) => updateQuestion(index, { prompt: e.target.value })}
                        fullWidth
                        multiline
                        minRows={2}
                        disabled={!editingCustom || saving}
                      />
                      {question.options.map((option, optionIndex) => (
                        <TextField
                          key={optionIndex}
                          label={`Option ${String.fromCharCode(65 + optionIndex)}`}
                          value={option}
                          onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                          fullWidth
                          disabled={!editingCustom || saving}
                        />
                      ))}
                      <FormControl fullWidth disabled={!editingCustom || saving}>
                        <InputLabel id={`correct-${question.id}`}>Correct answer</InputLabel>
                        <Select
                          labelId={`correct-${question.id}`}
                          value={question.correctIndex}
                          label="Correct answer"
                          onChange={(e) =>
                            updateQuestion(index, { correctIndex: Number(e.target.value) })
                          }
                        >
                          {question.options.map((option, optionIndex) => (
                            <MenuItem key={optionIndex} value={optionIndex}>
                              {String.fromCharCode(65 + optionIndex)}
                              {option ? `: ${option}` : ""}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              ))}

              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {editingCustom && (
                  <>
                    <Button variant="contained" onClick={() => void handleSave()} disabled={saving}>
                      {saving ? "Saving..." : "Save category"}
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => {
                        setDraft(null);
                        setSaveError(null);
                      }}
                      disabled={!isDirty || saving}
                    >
                      Discard changes
                    </Button>
                    {!draft && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => void handleDelete()}
                        disabled={saving}
                      >
                        Delete category
                      </Button>
                    )}
                  </>
                )}
                <Button variant="text" onClick={() => downloadTopicJson(activeTopic)}>
                  Export JSON
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Alert severity="info">Select a category to view or edit its questions.</Alert>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
