import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
// Puerto dinámico para Heroku
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint to fetch topics (calls the Streamlit service)
app.get("/api/topics", async (req, res) => {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 15000);

    const response = await fetch("https://english-learning-api-fe5cfdfe6cca.herokuapp.com/topics", {
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
        error: `El servidor de contenidos LearnEnglishWithAI respondió con estado de error ${response.status}.`
      });
    }
  } catch (error) {
    console.error("Failed to reach Heroku topics:", error);
    return res.status(500).json({
      error: `No se pudo establecer comunicación con el servidor de contenidos LearnEnglishWithAI: ${(error as Error).message}.`
    });
  }
});

// Endpoint to generate quiz questions (sin datos duros)
app.post("/api/quiz/generate", async (req, res) => {
  return res.json({ questions: [] });
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
      .replace(/['’]/g, "'")
      .replace(/\s+/g, " ")
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
  };

  const cleanUser = normalize(userAnswer);
  const cleanExpected = normalize(expectedAnswer);

  const isDirectMatch = cleanUser === cleanExpected;
  
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

setupServerAndVite();
