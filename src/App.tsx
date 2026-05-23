import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, Sparkles, MessageSquare, Flame, CheckCircle2, 
  HelpCircle, ChevronRight, GraduationCap, ArrowRight,
  Info, Loader2, CheckCircle, RefreshCw
} from "lucide-react";

import { Topic, UserState } from "./types";
import Header from "./components/Header";
import TopicDetails from "./components/TopicDetails";
import QuizContainer from "./components/QuizContainer";

const DEFAULT_USER_STATE: UserState = {
  completedTopics: [],
  scores: {},
  streak: 1,
  lastActive: new Date().toISOString()
};

export default function App() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTopicId, setSelectedTopicId] = useState<number>(1);
  const [isInQuiz, setIsInQuiz] = useState(false);

  const [userState, setUserState] = useState<UserState>(() => {
    const saved = localStorage.getItem("fce_grammar_progress");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserState;
        // Verify streak rules on load
        return checkAndComputeStreak(parsed);
      } catch (err) {
        console.error("Failed to parse user state, restoring defaults.", err);
      }
    }
    return DEFAULT_USER_STATE;
  });

  // Check engagement streak
  function checkAndComputeStreak(stateToVerify: UserState): UserState {
    const todayStr = new Date().toDateString();
    const lastActiveStr = new Date(stateToVerify.lastActive).toDateString();
    
    if (todayStr === lastActiveStr) {
      // Already active today, streak safe
      return stateToVerify;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    if (lastActiveStr === yesterdayStr) {
      // Active yesterday, streak safe. Don't increment yet until they take a quiz or read a topic
      return stateToVerify;
    } else {
      // Streak broken, reset to 1
      return {
        ...stateToVerify,
        streak: 1,
        lastActive: new Date().toISOString()
      };
    }
  }

  // Load topics from server proxy
  useEffect(() => {
    const loadTopics = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch("/api/topics");
        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || `Error del servidor (${resp.status})`);
        }
        const data = await resp.json();
        if (Array.isArray(data) && data.length > 0) {
          setTopics(data);
          setSelectedTopicId(data[0].id);
        } else {
          throw new Error("Formato de temas incorrecto de LearnEnglishWithAI.");
        }
      } catch (err: any) {
        console.error("Failed to fetch topics:", err);
        setError(err.message || "No pudimos conectar con los servicios de contenido.");
      } finally {
        setLoading(false);
      }
    };

    loadTopics();
  }, []);

  // Save progress changes to storage
  useEffect(() => {
    localStorage.setItem("fce_grammar_progress", JSON.stringify(userState));
  }, [userState]);

  // Streak incrementation logic
  const touchActivity = () => {
    setUserState(prev => {
      const todayStr = new Date().toDateString();
      const lastActiveStr = new Date(prev.lastActive).toDateString();
      
      let newStreak = prev.streak;
      if (todayStr !== lastActiveStr) {
        // Last active was previous day or older
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        
        if (lastActiveStr === yesterdayStr) {
          newStreak = prev.streak + 1; // carrying on
        } else {
          newStreak = 1; // recovered from break
        }
      }

      return {
        ...prev,
        streak: newStreak,
        lastActive: new Date().toISOString()
      };
    });
  };

  const handleToggleComplete = (topicId: number) => {
    touchActivity();
    setUserState(prev => {
      const isAlreadyCompleted = prev.completedTopics.includes(topicId);
      const newCompleted = isAlreadyCompleted
        ? prev.completedTopics.filter(id => id !== topicId)
        : [...prev.completedTopics, topicId];

      return {
        ...prev,
        completedTopics: newCompleted
      };
    });
  };

  const handleSaveScore = (topicId: number, scorePercent: number) => {
    touchActivity();
    setUserState(prev => {
      const currentBest = prev.scores[topicId] || 0;
      const newBest = Math.max(currentBest, scorePercent);
      
      // Auto-mark completed if they scored above 50%
      const newCompleted = scorePercent >= 50 && !prev.completedTopics.includes(topicId)
        ? [...prev.completedTopics, topicId]
        : prev.completedTopics;

      return {
        ...prev,
        scores: {
          ...prev.scores,
          [topicId]: newBest
        },
        completedTopics: newCompleted
      };
    });
  };

  const handleResetProgress = () => {
    setUserState(DEFAULT_USER_STATE);
  };

  const currentTopic = topics.find(t => t.id === selectedTopicId) || null;

  // Compute overall statistics
  const completedCount = userState.completedTopics.length;
  const totalCount = topics.length;
  
  const scoreKeys = Object.keys(userState.scores);
  const averageScore = scoreKeys.length > 0
    ? Math.round(scoreKeys.reduce((acc, k) => acc + userState.scores[Number(k)], 0) / scoreKeys.length)
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 selection:bg-blue-600 selection:text-white pb-12 text-slate-900">
      
      {/* Platform Header */}
      <Header
        streak={userState.streak}
        completedCount={completedCount}
        totalCount={totalCount}
        averageScore={averageScore}
        onResetProgress={handleResetProgress}
      />

      {/* Main layout frame */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Optimizando el temario de gramática inglesa B2...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-red-100 rounded-2xl p-8 max-w-lg mx-auto text-center space-y-4 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Info className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-950">Error al cargar temas</h3>
            <p className="text-sm text-slate-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Recargar página
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Drawer / Nav Sidebar: Topics List */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Tiempos Verbales
                </span>
                <span className="text-xxs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  Cambridge Unit 04
                </span>
              </div>

              <div className="space-y-1">
                {topics.map((t) => {
                  const isActive = t.id === selectedTopicId;
                  const isTopicCompleted = userState.completedTopics.includes(t.id);
                  const topicBestMark = userState.scores[t.id];

                  return (
                    <button
                      key={t.id}
                      id={`sidebar-topic-${t.id}`}
                      onClick={() => {
                        setSelectedTopicId(t.id);
                        setIsInQuiz(false); // Close quiz when selecting new topic
                      }}
                      className={`w-full text-left p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all ${
                        isActive
                          ? "sidebar-item-active font-bold shadow-xs"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-800 font-semibold"
                      }`}
                    >
                      {/* Vibrant small color indicator depending on active / complete state */}
                      <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        isActive 
                          ? "bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.5)]" 
                          : isTopicCompleted 
                            ? "bg-emerald-500" 
                            : "bg-slate-300"
                      }`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-sm truncate">
                            {t.title}
                          </span>
                          {isTopicCompleted && (
                            <span className="text-xxs text-emerald-600 font-extrabold bg-emerald-50 px-1 py-0.2 rounded-sm border border-emerald-100 shrink-0">LÍSTO</span>
                          )}
                        </div>
                        
                        {/* Quiz High Score Badge */}
                        {topicBestMark !== undefined && (
                          <span className="inline-block text-xxs font-bold bg-white/60 text-slate-500 px-1 rounded-sm mt-0.5">
                            Test: {topicBestMark}% {topicBestMark >= 80 ? "🏆" : ""}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* High quality visual progress box from template */}
              <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-md shadow-indigo-100/60">
                <p className="text-xxs font-bold opacity-80 uppercase tracking-wider">Tu Nivel FCE</p>
                <p className="text-lg font-extrabold tracking-tight">Upper Intermediate (B2)</p>
                <div className="w-full bg-white/20 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className="h-full bg-white transition-all duration-500"
                    style={{ width: `${Math.max(15, (completedCount / (totalCount || 5)) * 100)}%` }}
                  />
                </div>
                <p className="text-xxs opacity-90 mt-1.5 font-medium">
                  {completedCount} de {totalCount} temas gramaticales dominados
                </p>
              </div>

              {/* Cambridge exam info widget */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <GraduationCap className="w-4 h-4 text-slate-600" />
                  <span>Sobre Cambridge First (B2)</span>
                </div>
                <p className="text-xxs text-slate-500 leading-relaxed">
                  El examen B2 evalúa rigorosamente estos 5 tiempos verbales en la sección <strong>"Use of English Part 4"</strong> (frases con palabra clave). Dominar el Present Simple, Continuous, Past Simple, Present Perfect y Past Perfect es indispensable para aprobar.
                </p>
              </div>
            </div>

            {/* Right Panel: Content Area */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* If student is taking the exam, isolate the quiz screen */}
              {isInQuiz && currentTopic ? (
                <QuizContainer
                  topic={currentTopic}
                  onClose={() => setIsInQuiz(false)}
                  onSaveScore={(scoreVal) => handleSaveScore(currentTopic.id, scoreVal)}
                />
              ) : (
                currentTopic && (
                  <AnimatePresence mode="wait">
                    <TopicDetails
                      key={`details-${currentTopic.id}`}
                      topic={currentTopic}
                      isCompleted={userState.completedTopics.includes(currentTopic.id)}
                      onToggleComplete={() => handleToggleComplete(currentTopic.id)}
                      onStartQuiz={() => setIsInQuiz(true)}
                    />
                  </AnimatePresence>
                )
              )}

            </div>

          </div>
          </>
        )}
      </main>
    </div>
  );
}
