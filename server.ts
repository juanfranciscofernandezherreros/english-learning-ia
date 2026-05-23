import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Endpoint to fetch topics (calls the Streamlit service)
app.get("/api/topics", async (req, res) => {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout to allow for Heroku cold boots/spins

    const response = await fetch("https://heroku-streamlit-kikster-8413291d3fe7.herokuapp.com/topics", {
      headers: { "accept": "application/json" },
      signal: controller.signal
    });
    clearTimeout(id);

    if (response.ok) {
      const data = await response.json();
      return res.json(data);
    } else {
      console.error(`Heroku topics endpoint replied with non-ok status: ${response.status}`);
      return res.status(500).json({
        error: `El servidor de contenidos LearnEnglishWithAI respondió con estado de error ${response.status} (${response.statusText}).`
      });
    }
  } catch (error) {
    console.error("Failed to reach Heroku topics:", error);
    return res.status(500).json({
      error: `No se pudo establecer comunicación con el servidor de contenidos LearnEnglishWithAI: ${(error as Error).message}.`
    });
  }
});

// Specialized, unit-tailored B2 Cambridge-aligned questions
const PRESENT_TENSES_QUESTIONS = [
  {
    id: 1,
    type: "multiple-choice",
    question: "My brother ________ (love) comedies, but he ________ (not enjoy) scary movies at all.",
    options: [
      "is loving / doesn't enjoy",
      "loves / isn't enjoying",
      "loves / doesn't enjoy",
      "is loving / is not enjoying"
    ],
    correctAnswer: "loves / doesn't enjoy",
    explanation: "Los verbos de estado como 'love' expresan sentimientos y no se suelen usar en presente continuo. Para hábitos ('not enjoy'), el presente simple negativo de tercera persona utiliza 'doesn't' seguido del verbo base: 'doesn't enjoy'."
  },
  {
    id: 2,
    type: "fill-blank",
    question: "Complete the sentence with the correct form: 'Please be quiet, I ________ (try) to concentrate on this difficult Cambridge reading exercise.'",
    correctAnswer: "am trying",
    explanation: "El contexto 'Please be quiet' indica que la acción está ocurriendo en este preciso momento de hablar, lo cual exige el Presente Continuo: 'am trying'."
  },
  {
    id: 3,
    type: "transformation",
    question: "FCE Transformation:\nOriginal: I don't see any difference between these two grammar rules.\nKeyword: SAME\nTemplate: These two grammar rules _______________ to me.",
    correctAnswer: "look the same",
    explanation: "La expresión 'look the same' mantiene el significado de no ver diferencias, usando el verbo de estado 'look' en presente simple."
  },
  {
    id: 4,
    type: "multiple-choice",
    question: "Which of these is grammatically INCORRECT in English?",
    options: [
      "I am dynamic today.",
      "I am remembering my first English class.",
      "I remember my first English class.",
      "I am thinking about taking the B2 exam."
    ],
    correctAnswer: "I am remembering my first English class.",
    explanation: "'Remember' es un verbo de estado (mental) que por norma general no se utiliza en presente continuo. La forma correcta en presente simple es 'I remember'."
  },
  {
    id: 5,
    type: "transformation",
    question: "FCE Transformation:\nOriginal: She has a habit of biting her nails when she is nervous.\nKeyword: IS\nTemplate: She _______________ her nails when she is nervous.",
    correctAnswer: "is always biting",
    explanation: "En inglés, podemos usar 'always' con el Presente Continuo para expresar un hábito repetitivo que suele ser molesto o llamativo, traduciendo perfectamente 'has a habit'."
  }
];

const PAST_TENSES_QUESTIONS = [
  {
    id: 1,
    type: "multiple-choice",
    question: "We ________ (have) dinner when suddenly the lights ________ (go) out.",
    options: [
      "had / were going",
      "were having / went",
      "had / went",
      "were having / were going"
    ],
    correctAnswer: "were having / went",
    explanation: "Usamos el Pasado Continuo ('were having') para expresar una acción prolongada que servía de escenario de fondo en el pasado, y el Pasado Simple ('went') para la acción puntual que la interrumpió."
  },
  {
    id: 2,
    type: "fill-blank",
    question: "Complete the sentence with the correct form: 'When I was five, my family ________ (use) to spend every single summer holiday in a small cottage near the beach.'",
    correctAnswer: "used",
    explanation: "La estructura para expresar hábitos o situaciones del pasado que ya no ocurren es 'used to' + infinitivo."
  },
  {
    id: 3,
    type: "transformation",
    question: "FCE Transformation:\nOriginal: Walking in the rain was a common habit for us during autumn.\nKeyword: WOULD\nTemplate: During autumn, we _______________ for a walk in the rain.",
    correctAnswer: "would often go",
    explanation: "El infinitivo con 'would' se usa para describir hábitos o comportamientos repetidos en el pasado ('we would often go')."
  },
  {
    id: 4,
    type: "multiple-choice",
    question: "Which of the following sentences with 'would' is grammatically INCORRECT?",
    options: [
      "We would run in the schoolyard every afternoon.",
      "My family would have a huge dog during my childhood.",
      "My teacher would tell us funny stories after lunch.",
      "If we had free time, we would visit the museum."
    ],
    correctAnswer: "My family would have a huge dog during my childhood.",
    explanation: "No podemos utilizar 'would' para estados del pasado (como tener un perro: 'have'). En este caso, para estados duraderos, debemos usar 'used to': 'My family used to have a huge dog...'"
  },
  {
    id: 5,
    type: "transformation",
    question: "FCE Transformation:\nOriginal: I didn't like broccoli when I was a child.\nKeyword: USE\nTemplate: I _______________ like broccoli when I was a child.",
    correctAnswer: "didn't use to",
    explanation: "En forma negativa, la estructura 'used to' pierde la '-d' final porque ya llevamos el auxiliar 'didn't', de modo que queda 'didn't use to'."
  }
];

// Endpoint to generate 5 robust quiz questions natively
app.post("/api/quiz/generate", async (req, res) => {
  const { topicTitle } = req.body;

  if (!topicTitle) {
    return res.status(400).json({ error: "Topic title is required" });
  }

  const normalizedTitle = topicTitle.toLowerCase();
  if (normalizedTitle.includes("past") || normalizedTitle.includes("unit 2") || normalizedTitle.includes("used to")) {
    return res.json({ questions: PAST_TENSES_QUESTIONS });
  }

  // Default to Present Tenses set (Unit 1)
  return res.json({ questions: PRESENT_TENSES_QUESTIONS });
});

// Endpoint to verify Key Word Transformation free-text input
app.post("/api/quiz/verify-transformation", async (req, res) => {
  const { userAnswer, expectedAnswer, explanation } = req.body;

  if (!userAnswer) {
    return res.json({ isCorrect: false, feedback: "Por favor, escribe una respuesta para evaluarla." });
  }

  const normalize = (str: string) => {
    return str
      .trim()
      .toLowerCase()
      .replace(/['’]/g, "'") // normalize curly apostrophes
      .replace(/\s+/g, " ")  // normalize multiple spaces
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""); // remove structural punctuation
  };

  const cleanUser = normalize(userAnswer);
  const cleanExpected = normalize(expectedAnswer);

  // Smart checking for common contraction variances
  const isDirectMatch = cleanUser === cleanExpected;
  
  // Support equivalent contractions
  const withContractions = (text: string) => {
    return text
      .replace("did not", "didnt")
      .replace("do not", "dont")
      .replace("does not", "doesnt")
      .replace("cannot", "cant")
      .replace("is not", "isnt")
      .replace("are not", "arent")
      .replace("look the same", "look same");
  };

  const isMatched = isDirectMatch || withContractions(cleanUser) === withContractions(cleanExpected);

  return res.json({
    isCorrect: isMatched,
    feedback: isMatched
      ? "¡Excelente trabajo! Tu respuesta es correcta y cumple con las reglas gramaticales de Cambridge."
      : `Tu respuesta: "${userAnswer}". Estructura esperada: "${expectedAnswer}". Explicación: ${explanation}`
  });
});

// Vite/Static Setup
const setupServerAndVite = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serves compiled index.css, dist/ index.html, etc.
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
};

setupServerAndVite();
