import { motion } from "motion/react";
import { CheckCircle2, AlertCircle, Quote, Sparkles, Award } from "lucide-react";
import { Topic } from "../types";
import Markdown from "react-markdown";

interface TopicDetailsProps {
  key?: string;
  topic: Topic;
  isCompleted: boolean;
  onToggleComplete: () => void;
  onStartQuiz: () => void;
}

export default function TopicDetails({
  topic,
  isCompleted,
  onToggleComplete,
  onStartQuiz
}: TopicDetailsProps) {
  
  return (
    <motion.div
      key={topic.id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 space-y-6"
    >
      {/* Header Topic Row */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-750 text-[10px] font-bold uppercase rounded-full tracking-wider mb-2.5 inline-block">
            Tema #{topic.id} • Cambridge Preparation Unit 04
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-1 leading-tight">
            {topic.title}
          </h2>
          <p className="text-base sm:text-lg text-slate-650 font-medium leading-relaxed mt-2">
            {topic.summary}
          </p>
        </div>

        {/* Complete State Button */}
        <div className="flex sm:flex-col items-start sm:items-end gap-3 shrink-0 self-start sm:self-auto">
          <button
            id={`toggle-complete-${topic.id}`}
            onClick={onToggleComplete}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              isCompleted 
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/80" 
                : "bg-slate-50 text-slate-600 border border-slate-205 hover:bg-slate-100"
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${isCompleted ? "text-emerald-600 fill-emerald-100" : "text-slate-400"}`} />
            {isCompleted ? "Completado" : "Marcar como leído"}
          </button>
        </div>
      </div>

      {/* Main explanation content rendered as Markdown */}
      <div className="markdown-body text-slate-700 leading-relaxed text-sm sm:text-base space-y-2">
        <Markdown
          components={{
            h1: ({node, ...props}) => <h1 className="text-2xl font-extrabold text-slate-950 mt-6 mb-3 border-b border-slate-150 pb-1" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-xl font-extrabold text-slate-900 mt-5 mb-2.5 border-b border-slate-100 pb-1" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-lg font-bold text-indigo-700 mt-4 mb-2" {...props} />,
            p: ({node, ...props}) => <p className="text-slate-650 leading-relaxed text-sm sm:text-base mb-3 whitespace-pre-line" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc list-outside space-y-2.5 pl-5 mb-4 text-slate-650 bg-slate-50/50 rounded-xl p-4 border border-slate-100" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal list-outside space-y-2.5 pl-5 mb-4 text-slate-650 bg-slate-50/50 rounded-xl p-4 border border-slate-100" {...props} />,
            li: ({node, ...props}) => <li className="pl-1" {...props} />,
            code: ({node, ...props}) => <code className="bg-slate-150 text-slate-800 px-1.5 py-0.5 rounded font-mono text-xs font-semibold border border-slate-200" {...props} />,
            strong: ({node, ...props}) => <strong className="font-extrabold text-slate-900" {...props} />,
            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-200 pl-4 py-1 italic text-slate-600 my-4" {...props} />,
          }}
        >
          {topic.content}
        </Markdown>
      </div>

      {/* Interactive/Styled Examples */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pl-1">
          <Quote className="w-3.5 h-3.5 fill-slate-300 stroke-slate-400" />
          Ejemplos Clave & Transformaciones B2
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {topic.examples.map((example, index) => {
            // Check if it's a Use of English transformation like: I started... (FOR) - I have...
            const hasTransformation = example.includes(" - ");
            if (hasTransformation) {
              const [original, transformed] = example.split(" - ");
              return (
                <div 
                  key={index} 
                  className="bg-indigo-50/50 border-l-4 border-indigo-500 rounded-r-xl p-4 transition-all hover:bg-indigo-50/85"
                >
                  <div className="space-y-2">
                    <p className="text-xs text-indigo-500 font-extrabold font-mono uppercase">Transformación FCE #{index + 1}</p>
                    <div className="text-slate-700 text-sm italic font-medium">
                      {original}
                    </div>
                    <div className="text-indigo-900 text-sm font-extrabold pl-2 border-l border-indigo-200">
                      ➔ {transformed}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={index} 
                className="bg-slate-50/70 hover:bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-start gap-3 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-slate-200/60 flex items-center justify-center text-slate-600 font-bold text-xs shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <div className="text-slate-850 text-sm md:text-base font-medium">
                  {example}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assessment Action Button */}
      <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Sparkles className="w-4 h-4 text-indigo-500 animate-bounce" />
          <span>¿Listo para poner a prueba tu nivel FCE con este tema?</span>
        </div>
        <button
          id={`start-quiz-${topic.id}`}
          onClick={onStartQuiz}
          className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold rounded-xl text-sm transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-indigo-150 cursor-pointer"
        >
          <Award className="w-4 h-4" />
          Realizar Evaluación del Tema
        </button>
      </div>

    </motion.div>
  );
}
