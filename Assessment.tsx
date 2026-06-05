import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ChevronRight, BrainCircuit, Loader2, Target, Trophy, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { Skill } from '../services/geminiService';

interface AssessmentProps {
  questions: any[];
  onComplete: (results: any) => void;
  onCancel: () => void;
}

export const Assessment: React.FC<AssessmentProps> = ({ questions, onComplete, onCancel }) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = questions[currentQuestionIdx];

  const handleAnswerSelect = (option: string) => {
    setAnswers(prev => ({ ...prev, [currentQuestionIdx]: option }));
  };

  const handleNext = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) {
        score++;
      }
    });
    return score;
  };

  if (isFinished) {
    const score = calculateScore();
    const percentage = (score / questions.length) * 100;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl w-full"
      >
        <Card className="text-center p-16 border-none shadow-none bg-transparent">
          <div className="w-20 h-20 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center mx-auto mb-8 shadow-2xl">
            <Trophy className="w-10 h-10" />
          </div>
          <div className="ui-label mb-6">Assessment.Complete</div>
          <h2 className="text-5xl ui-heading mb-6">Validation Results</h2>
          <p className="text-zinc-500 dark:text-zinc-400 mb-16 font-light text-xl">
            Performance Index: <span className="text-zinc-900 dark:text-white font-medium">{score} / {questions.length}</span> ({percentage}%)
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 text-left">
            {questions.map((q, idx) => (
              <div key={idx} className={`p-8 border transition-all duration-300 ${answers[idx] === q.correctAnswer ? 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/10' : 'border-rose-100 dark:border-rose-900/30 bg-rose-50/10'}`}>
                <div className="flex items-start gap-6">
                  {answers[idx] === q.correctAnswer ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-1" /> : <AlertCircle className="w-5 h-5 text-rose-500 mt-1" />}
                  <div>
                    <p className="ui-label mb-3">{q.skill}</p>
                    <p className="text-base font-medium leading-relaxed text-zinc-800 dark:text-zinc-200">{q.question}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-8 justify-center pt-10 border-t border-zinc-100 dark:border-zinc-800">
            <Button onClick={() => onComplete({ score, percentage })} className="rounded-none h-16 px-14 text-base ui-btn">
              Update.Profile
            </Button>
            <Button variant="ghost" onClick={onCancel} className="ui-label dark:text-zinc-400 dark:hover:text-white">
              Dismiss
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl w-full"
    >
      <div className="flex justify-between items-end mb-16">
        <div>
          <div className="ui-label mb-6">Skill.Validation</div>
          <h2 className="text-5xl ui-heading">Technical Assessment</h2>
          <p className="text-zinc-500 dark:text-zinc-400 font-light mt-4 uppercase text-[11px] font-mono tracking-[0.3em]">Question {currentQuestionIdx + 1} of {questions.length}</p>
        </div>
        <div className="flex gap-3 mb-3">
          {questions.map((_, idx) => (
            <div key={idx} className={`h-1.5 w-16 transition-all duration-700 ${idx <= currentQuestionIdx ? 'bg-zinc-900 dark:bg-white' : 'bg-zinc-100 dark:bg-zinc-800'}`} />
          ))}
        </div>
      </div>

      <Card className="p-16 border-zinc-100 dark:border-zinc-800 shadow-sm ui-card">
        <div className="mb-16">
          <div className="ui-label mb-8 flex items-center gap-4">
            <div className="w-8 h-px bg-zinc-200 dark:bg-zinc-800" />
            Subject: {currentQuestion.skill}
          </div>
          <h3 className="text-4xl ui-heading leading-tight">
            {currentQuestion.question}
          </h3>
        </div>

        <div className="space-y-6 mb-16">
          {currentQuestion.options.map((option: string, idx: number) => (
            <button
              key={idx}
              onClick={() => handleAnswerSelect(option)}
              className={`w-full text-left p-8 border transition-all duration-500 flex items-center justify-between group ${
                answers[currentQuestionIdx] === option 
                  ? 'border-zinc-900 dark:border-white bg-zinc-900 dark:bg-white text-white dark:text-zinc-900' 
                  : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 bg-zinc-50/30 dark:bg-zinc-900/30'
              }`}
            >
              <span className="text-base font-medium tracking-tight">{option}</span>
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                answers[currentQuestionIdx] === option 
                  ? 'border-white/30 dark:border-zinc-900/30' 
                  : 'border-zinc-200 dark:border-zinc-700 group-hover:border-zinc-400 dark:group-hover:border-zinc-500'
              }`}>
                {answers[currentQuestionIdx] === option && <div className="w-2 h-2 rounded-full bg-white dark:bg-zinc-900" />}
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-between items-center pt-10 border-t border-zinc-50 dark:border-zinc-800">
          <Button variant="ghost" onClick={onCancel} className="ui-label dark:text-zinc-400 dark:hover:text-white">
            Terminate Assessment
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={!answers[currentQuestionIdx]}
            className="min-w-[220px] h-16 rounded-none text-base ui-btn"
          >
            {currentQuestionIdx === questions.length - 1 ? 'Finalize' : 'Next.Phase'}
            <ChevronRight className="w-5 h-5 ml-3" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
