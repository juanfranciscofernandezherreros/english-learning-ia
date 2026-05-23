import { BookOpen, Trophy, Flame, Play } from "lucide-react";

interface HeaderProps {
  streak: number;
  completedCount: number;
  totalCount: number;
  averageScore: number;
  onResetProgress: () => void;
}

export default function Header({ 
  streak, 
  completedCount, 
  totalCount, 
  averageScore,
  onResetProgress 
}: HeaderProps) {
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <BookOpen className="w-5 h-5" id="header-logo-icon" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                LearnEnglishWithAI <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">B2 Prep</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Aprende los 5 tiempos verbales clave para el FCE</p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            
            {/* Creative Avatars indicator from template */}
            <div className="hidden sm:flex -space-x-1.5 items-center mr-2">
              <div className="w-7 h-7 rounded-full border-2 border-white bg-blue-400" />
              <div className="w-7 h-7 rounded-full border-2 border-white bg-emerald-400" />
              <div className="w-7 h-7 rounded-full border-2 border-white bg-rose-400" />
            </div>

            {/* Streak Widget */}
            <div className="flex items-center gap-2 bg-amber-50/60 border border-amber-100 rounded-lg px-3 py-1.5" title="Tus días seguidos practicando">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
              <div className="text-left">
                <span className="block text-xs text-amber-800 font-medium leading-none">Racha</span>
                <span className="text-sm font-bold text-amber-950">{streak} {streak === 1 ? 'día' : 'días'}</span>
              </div>
            </div>

            {/* Completion Widget */}
            <div className="flex items-center gap-2 bg-emerald-50/60 border border-emerald-100 rounded-lg px-3 py-1.5" title="Temas marcados como completados">
              <Trophy className="w-4 h-4 text-emerald-600" />
              <div className="text-left">
                <span className="block text-xs text-emerald-800 font-medium leading-none">Progreso</span>
                <span className="text-sm font-bold text-emerald-950">{percentComplete}% <span className="font-normal text-xs text-emerald-700">({completedCount}/{totalCount})</span></span>
              </div>
            </div>

            {/* Average Score Widget */}
            <div className="flex items-center gap-2 bg-indigo-50/60 border border-indigo-100 rounded-lg px-3 py-1.5" title="Puntuación promedio de tus tests">
              <Play className="w-4 h-4 text-indigo-600 fill-indigo-500/10 rotate-90" />
              <div className="text-left">
                <span className="block text-xs text-indigo-800 font-medium leading-none">Media Test</span>
                <span className="text-sm font-bold text-indigo-950">{averageScore}%</span>
              </div>
            </div>

            {/* Mini actions */}
            <button
              id="btn-reset-progress"
              onClick={() => {
                if (confirm("¿Estás seguro de que quieres restablecer tu progreso? Se borrarán tus rachas e historial de tests.")) {
                  onResetProgress();
                }
              }}
              className="text-xs text-slate-400 hover:text-red-500 hover:underline transition-colors px-2 py-1.5 rounded-md hover:bg-slate-50"
            >
              Reiniciar
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
