import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Check, X, ChevronRight, RefreshCw, AlertCircle, Info, 
  HelpCircle, ThumbsUp, Sparkles, BookOpen, Award
} from "lucide-react";
import { QuizQuestion, Topic } from "../types";

interface QuizContainerProps {
  topic: Topic;
  onClose: () => void;
  onSaveScore: (score: number) => void;
}

export default function QuizContainer({ topic, onClose, onSaveScore }: QuizContainerProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});
  const [evaluatingAI, setEvaluatingAI] = useState(false);
  const [aiFeedbacks, setAiFeedbacks] = useState<Record<number, { isCorrect: boolean; feedback: string }>>({});

  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  // Load questions from backend
  const fetchQuestions = async () => {
    setLoading(true);
    setError(null);
    setCurrentIndex(0);
    setUserAnswers({});
    setSelectedOption(null);
    setTextAnswer("");
    setSubmitted({});
    setAiFeedbacks({});
    setScore(0);
    setQuizFinished(false);

    try {
      const resp = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topicTitle: topic.title,
          topicContent: topic.content 
        })
      });

      if (!resp.ok) {
        throw new Error("No se pudo obtener las preguntas del servidor.");
      }

      const data = await resp.json();
      if (data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
      } else {
        throw new Error("El servidor devolvió un formato de preguntas no esperado.");
      }
    } catch (err: any) {
      console.error(err);
      setError("Fallo de conexión o límite de cuota superado. Por favor, vuelve a intentarlo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [topic.id]);

  const currentQuestion = questions[currentIndex];

  // Submit Answer handler
  const handleSubmitAnswer = async () => {
    if (submitted[currentIndex] || evaluatingAI) return;

    let finalAnswer = "";
    if (currentQuestion.type === "multiple-choice") {
      if (!selectedOption) return;
      finalAnswer = selectedOption;
    } else {
      if (!textAnswer.trim()) return;
      finalAnswer = textAnswer.trim();
    }

    // Save user answer
    setUserAnswers(prev => ({ ...prev, [currentIndex]: finalAnswer }));

    if (currentQuestion.type === "multiple-choice" || currentQuestion.type === "fill-blank") {
      // Direct comparison (standard client side or basic exact matching)
      const cleanUser = finalAnswer.toLowerCase().replace(/['’]/g, "'").trim();
      const cleanExpected = currentQuestion.correctAnswer.toLowerCase().replace(/['’]/g, "'").trim();
      
      const isCorrect = cleanUser === cleanExpected || cleanExpected.includes(cleanUser);
      if (isCorrect) setScore(s => s + 1);

      setAiFeedbacks(prev => ({
        ...prev,
        [currentIndex]: {
          isCorrect,
          feedback: isCorrect 
            ? "¡Correcto! Tu respuesta encaja perfectamente con las reglas gramáticas." 
            : `No coincide. La respuesta oficial esperada es: "${currentQuestion.correctAnswer}".`
        }
      }));
      setSubmitted(prev => ({ ...prev, [currentIndex]: true }));

    } else if (currentQuestion.type === "transformation") {
      // Call modern server-side AI evaluator for Cambridge Transformations
      setEvaluatingAI(true);
      try {
        const resp = await fetch("/api/quiz/verify-transformation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: currentQuestion.question,
            expectedAnswer: currentQuestion.correctAnswer,
            explanation: currentQuestion.explanation,
            userAnswer: finalAnswer
          })
        });

        if (resp.ok) {
          const evalResult = await resp.json();
          if (evalResult.isCorrect) {
            setScore(s => s + 1);
          }
          setAiFeedbacks(prev => ({ ...prev, [currentIndex]: evalResult }));
        } else {
          throw new Error("Error evaluating");
        }
      } catch (err) {
        // Fallback matching
        const cleanUser = finalAnswer.toLowerCase().replace(/['’]/g, "'").trim();
        const cleanExpected = currentQuestion.correctAnswer.toLowerCase().replace(/['’]/g, "'").trim();
        const equals = cleanUser === cleanExpected;
        if (equals) setScore(s => s + 1);

        setAiFeedbacks(prev => ({
          ...prev,
          [currentIndex]: {
            isCorrect: equals,
            feedback: `Fallo la API de evaluación. Match rudimentario: ${equals ? 'Correcto' : 'La clave esperada es: "' + currentQuestion.correctAnswer + '"'}`
          }
        }));
      } finally {
        setEvaluatingAI(false);
        setSubmitted(prev => ({ ...prev, [currentIndex]: true }));
      }
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setTextAnswer("");
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Finished
      setQuizFinished(true);
      const finalScorePercentage = Math.round((score / questions.length) * 100);
      onSaveScore(finalScorePercentage);
    }
  };

  // Re-map index percentage of completion
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex) / questions.length) * 100) : 0;

  // Lading Screen
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center justify-center min-h-[350px] space-y-4 text-center">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
        <div>
          <h3 className="text-lg font-bold text-slate-800">Cargando Evaluación Interactiva</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            Utilizando Gemini para generar un cuestionario personalizado de Cambridge B2 sobre <span className="font-semibold text-indigo-600">"{topic.title}"</span>...
          </p>
        </div>
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 max-w-md text-xs text-indigo-805 flex items-start gap-2.5 text-left">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <span><strong>Consejo B2:</strong> En los ejercicios "Key Word Transformation" nunca debes usar más de 6 palabras ni cambiar la palabra clave dada. ¡El tutor revisará tu respuesta!</span>
        </div>
      </div>
    );
  }

  // Error Screen
  if (error || questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center justify-center min-h-[300px] text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">No pudimos cargar el Test</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1">{error || "No se encontraron preguntas en este momento."}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchQuestions} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer">
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold rounded-xl transition-all cursor-pointer">
            Volver al Tema
          </button>
        </div>
      </div>
    );
  }

  // Quiz Finished / Score report screen
  if (quizFinished) {
    const finalPercent = Math.round((score / questions.length) * 100);
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6"
      >
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 rounded-full bg-indigo-50 mx-auto flex items-center justify-center text-indigo-600 shadow-inner">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-950">¡Cuestionario Completado!</h3>
            <p className="text-sm text-slate-500 mt-1">Has terminado la evaluación de <strong>"{topic.title}"</strong></p>
          </div>

          <div className="inline-flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-5xl font-extrabold text-slate-900">{score} / {questions.length}</span>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 mt-1 font-mono">Preguntas correctas</span>
            <span className="text-base font-bold text-indigo-650 mt-3">
              {finalPercent >= 80 ? "🏆 ¡Excelente, nivel Cambridge superado!" : finalPercent >= 50 ? "👍 ¡Buen intento! Un poco más de estudio" : "📖 Sigue repasando con el tutor AI"}
            </span>
          </div>
        </div>

        {/* Breakdown details */}
        <div className="border-t border-slate-100 pt-5 space-y-4">
          <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Explicación del Cuestionario</h4>
          <div className="space-y-3">
            {questions.map((q, idx) => {
              const isUserCorrect = aiFeedbacks[idx]?.isCorrect;
              return (
                <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 text-xs sm:text-sm space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-400">P{q.id}.</span>
                    <span className="font-medium text-slate-800 line-clamp-1">{q.question}</span>
                    <span className={`ml-auto px-2 py-0.5 rounded text-xxs font-bold ${
                      isUserCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}>
                      {isUserCorrect ? "Acierto" : "Fallo"}
                    </span>
                  </div>
                  <p className="text-slate-500 leading-relaxed text-xs">
                    <strong>Explicación:</strong> {q.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button 
            onClick={fetchQuestions}
            className="w-full sm:flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-100"
          >
            <RefreshCw className="w-4 h-4" /> Volver a Intentar (Nuevas Preguntas)
          </button>
          
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold rounded-xl text-sm transition-all text-center cursor-pointer"
          >
            Volver al Tema
          </button>
        </div>
      </motion.div>
    );
  }

  const isCurrentSubmitted = submitted[currentIndex];
  const activeFeedback = aiFeedbacks[currentIndex];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6"
    >
      
      {/* Quiz Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
          <span className="uppercase tracking-widest text-indigo-650 flex items-center gap-1.5 font-sans">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Evaluación Dinámica B2
          </span>
          <span>Pregunta {currentIndex + 1} de {questions.length}</span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Card Content */}
      <div className="space-y-4 pt-1">
        
        {/* Specialized instructions label depending on type */}
        <div className="flex items-center gap-2">
          {currentQuestion.type === "multiple-choice" && (
            <span className="text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full border border-purple-100">
              Opción Múltiple
            </span>
          )}
          {currentQuestion.type === "fill-blank" && (
            <span className="text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">
              Rellenar Hueco
            </span>
          )}
          {currentQuestion.type === "transformation" && (
            <span className="text-xs font-bold uppercase tracking-wider bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full border border-orange-100">
              Cambridge Part 4 - Transformations
            </span>
          )}
          <span className="text-xs text-slate-400 italic">Puntuación actual: {score}/{questions.length}</span>
        </div>

        {/* Question Text */}
        <h3 className="text-lg md:text-xl font-bold text-slate-800 leading-snug whitespace-pre-line">
          {currentQuestion.question}
        </h3>

        {/* Hint alert for transformations */}
        {currentQuestion.type === "transformation" && (
          <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-3 flex items-start gap-2.5 text-xs text-orange-950">
            <Info className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <span>
              Escribe únicamente la respuesta necesaria para completar el espacio en blanco (entre 2 y 6 palabras). No añadas texto de más ni alteres la palabra clave sugerida entre corchetes.
            </span>
          </div>
        )}

        {/* Answer Inputs Area */}
        <div className="pt-2">
          {currentQuestion.type === "multiple-choice" && currentQuestion.options ? (
            <div className="grid grid-cols-1 gap-2.5">
              {currentQuestion.options.map((opt, oIdx) => {
                const isSelected = selectedOption === opt;
                const isCorrectOpt = opt === currentQuestion.correctAnswer;
                
                let cardStyle = "border-slate-200 hover:border-slate-300 hover:bg-slate-50";
                if (isSelected) {
                  cardStyle = "border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600";
                }
                if (isCurrentSubmitted) {
                  if (isSelected) {
                    cardStyle = isCorrectOpt 
                      ? "border-emerald-500 bg-emerald-50/25 ring-1 ring-emerald-500" 
                      : "border-red-500 bg-red-50/25 ring-1 ring-red-500";
                  } else if (isCorrectOpt) {
                    cardStyle = "border-emerald-500 bg-emerald-50/15";
                  } else {
                    cardStyle = "border-slate-105 opacity-60";
                  }
                }

                return (
                  <button
                    key={oIdx}
                    disabled={isCurrentSubmitted}
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full text-left p-4 rounded-xl border text-sm sm:text-base font-bold transition-all flex items-center justify-between cursor-pointer ${cardStyle}`}
                  >
                    <span>{opt}</span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-305"
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            // Text Entry for Fill Blanks or Transformation
            <div className="space-y-2">
              <input
                type="text"
                disabled={isCurrentSubmitted || evaluatingAI}
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                placeholder={
                  currentQuestion.type === "transformation" 
                    ? "Escribe la transformación requerida aquí..." 
                    : "Escribe tu respuesta aquí (por ejemplo: 'are studying')..."
                }
                className={`w-full p-4 rounded-xl border text-sm md:text-base font-medium focus:outline-hidden transition-all ${
                  isCurrentSubmitted 
                    ? activeFeedback?.isCorrect 
                      ? "border-emerald-500 bg-emerald-50/10 text-emerald-950 font-mono" 
                      : "border-red-500 bg-red-50/10 text-red-950 font-mono"
                    : "border-slate-200 focus:border-slate-400 focus:ring-1 focus:ring-slate-300 bg-slate-50/30"
                }`}
              />
              {!isCurrentSubmitted && (
                <p className="text-xxs text-slate-400 pl-1 font-mono">Sensible al deletreo exacto</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Real-time Answer Feedback Box */}
      <AnimatePresence>
        {isCurrentSubmitted && activeFeedback && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`rounded-2xl border p-4 sm:p-5 space-y-3 ${
              activeFeedback.isCorrect 
                ? "bg-emerald-50/80 border-emerald-200/60 text-emerald-950" 
                : "bg-red-50/80 border-red-200/60 text-red-950"
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
              {activeFeedback.isCorrect ? (
                <>
                  <Check className="w-5 h-5 text-emerald-600 stroke-2 bg-emerald-100 rounded-full p-0.5" />
                  <span className="text-emerald-800">¡Respuesta Correcta! (+1 punto)</span>
                </>
              ) : (
                <>
                  <X className="w-5 h-5 text-red-600 stroke-2 bg-red-100 rounded-full p-0.5" />
                  <span className="text-red-800">Respuesta Incorrecta</span>
                </>
              )}
            </div>

            <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line text-slate-800">
              {activeFeedback.feedback}
            </p>

            <div className="border-t border-slate-200/60 pt-3 mt-1 text-xs text-slate-600 space-y-1">
              <p>📌 <strong>Clave oficial:</strong> <code className="bg-white/90 border border-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-900 font-semibold">{currentQuestion.correctAnswer}</code></p>
              <p className="leading-relaxed">💡 <strong>Por qué:</strong> {currentQuestion.explanation}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Submission / Next Question actions */}
      <div className="border-t border-slate-100 pt-5 flex items-center justify-between gap-4">
        <button
          onClick={onClose}
          className="text-xs sm:text-sm text-slate-400 hover:text-slate-600 hover:underline transition-colors px-1"
        >
          Cancelar evaluación
        </button>

        {!isCurrentSubmitted ? (
          <button
            id="btn-submit-answer"
            onClick={handleSubmitAnswer}
            disabled={
              evaluatingAI || 
              (currentQuestion.type === "multiple-choice" ? !selectedOption : !textAnswer.trim())
            }
            className={`px-5 py-3 rounded-xl font-extrabold text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer ${
              evaluatingAI || (currentQuestion.type === "multiple-choice" ? !selectedOption : !textAnswer.trim())
                ? "bg-slate-100 text-slate-400 shadow-none cursor-default"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100"
            }`}
          >
            {evaluatingAI ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Evaluando con AI...
              </>
            ) : (
              <>
                <span>Comprobar Respuesta</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        ) : (
          <button
            id="btn-next-question"
            onClick={handleNext}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold rounded-xl text-sm transition-all flex items-center gap-2 shadow-md shadow-indigo-150 cursor-pointer"
          >
            <span>{currentIndex < questions.length - 1 ? "Siguiente Pregunta" : "Ver Resultados"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

    </motion.div>
  );
}
