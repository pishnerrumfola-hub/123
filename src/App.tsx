/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  XCircle, 
  Printer, 
  Trash2, 
  RotateCcw, 
  Trophy, 
  BookOpen,
  ArrowRight
} from 'lucide-react';

// --- Types ---
interface Problem {
  id: string;
  type: 'addition' | 'subtraction' | 'multiplication' | 'division';
  knowledgePoint: string;
  num1: number;
  num2: number;
  operator: string;
  answer: number;
}

interface WrongRecord {
  id: string;
  problem: Problem;
  userAnswer: string;
  timestamp: number;
}

// --- Math Engine ---
const generateProblem = (type?: Problem['type'], knowledgePoint?: string): Problem => {
  const types: Problem['type'][] = ['addition', 'subtraction', 'multiplication', 'division'];
  const selectedType = type || types[Math.floor(Math.random() * types.length)];
  
  let num1 = 0, num2 = 0, operator = '', answer = 0, kp = '';

  switch (selectedType) {
    case 'addition':
      kp = knowledgePoint || (Math.random() > 0.5 ? '两位数加两位数' : '进位加法');
      num1 = Math.floor(Math.random() * 80) + 10;
      num2 = Math.floor(Math.random() * 80) + 10;
      operator = '+';
      answer = num1 + num2;
      break;
    case 'subtraction':
      kp = knowledgePoint || (Math.random() > 0.5 ? '两位数减两位数' : '退位减法');
      num1 = Math.floor(Math.random() * 80) + 20;
      num2 = Math.floor(Math.random() * (num1 - 5)) + 5;
      operator = '-';
      answer = num1 - num2;
      break;
    case 'multiplication':
      kp = knowledgePoint || '表内乘法';
      num1 = Math.floor(Math.random() * 8) + 2;
      num2 = Math.floor(Math.random() * 8) + 2;
      operator = '×';
      answer = num1 * num2;
      break;
    case 'division':
      kp = knowledgePoint || '表内除法';
      num2 = Math.floor(Math.random() * 8) + 2;
      answer = Math.floor(Math.random() * 8) + 2;
      num1 = num2 * answer;
      operator = '÷';
      break;
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    type: selectedType,
    knowledgePoint: kp,
    num1,
    num2,
    operator,
    answer
  };
};

export default function App() {
  // --- State ---
  const [currentProblem, setCurrentProblem] = useState<Problem>(generateProblem());
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | null, msg: string }>({ type: null, msg: '' });
  const [streak, setStreak] = useState(0);
  const [wrongRecords, setWrongRecords] = useState<WrongRecord[]>([]);
  const [reviewQueue, setReviewQueue] = useState<Problem[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Initialization ---
  useEffect(() => {
    const saved = localStorage.getItem('math_wrong_records');
    if (saved) setWrongRecords(JSON.parse(saved));
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    localStorage.setItem('math_wrong_records', JSON.stringify(wrongRecords));
  }, [wrongRecords]);

  // --- Handlers ---
  const handleCheck = () => {
    const numericAnswer = parseInt(userInput);
    if (isNaN(numericAnswer)) return;

    if (numericAnswer === currentProblem.answer) {
      // Correct
      setFeedback({ type: 'success', msg: '✓ 答对了！继续加油！' });
      
      if (isReviewMode) {
        // Review Mode Logic
        const newQueue = reviewQueue.slice(1);
        setReviewQueue(newQueue);
        if (newQueue.length === 0) {
          setTimeout(() => {
            setIsReviewMode(false);
            setCurrentProblem(generateProblem());
            setUserInput('');
            setFeedback({ type: null, msg: '' });
          }, 1000);
        } else {
          setTimeout(() => {
            setCurrentProblem(newQueue[0]);
            setUserInput('');
            setFeedback({ type: null, msg: '' });
          }, 1000);
        }
      } else {
        // Normal Mode Logic
        setStreak(s => s + 1);
        setTimeout(() => {
          setCurrentProblem(generateProblem());
          setUserInput('');
          setFeedback({ type: null, msg: '' });
        }, 1000);
      }
    } else {
      // Wrong
      setFeedback({ type: 'error', msg: `✕ 答错了，正确答案是 ${currentProblem.answer}` });
      
      if (!isReviewMode) {
        // Record wrong question
        const newRecord: WrongRecord = {
          id: Math.random().toString(36).substr(2, 9),
          problem: currentProblem,
          userAnswer: userInput,
          timestamp: Date.now()
        };
        setWrongRecords(prev => [newRecord, ...prev]);
        setStreak(0);

        // Enter Review Mode (One-to-Three)
        const variants = [
          generateProblem(currentProblem.type, currentProblem.knowledgePoint),
          generateProblem(currentProblem.type, currentProblem.knowledgePoint)
        ];
        setReviewQueue(variants);
        setTimeout(() => {
          setIsReviewMode(true);
          setCurrentProblem(variants[0]);
          setUserInput('');
          setFeedback({ type: null, msg: '' });
        }, 2000);
      } else {
        // Still wrong in review mode, just stay here
        setTimeout(() => {
          setUserInput('');
          setFeedback({ type: null, msg: '' });
        }, 1500);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCheck();
  };

  const clearRecords = () => {
    if (window.confirm('确定要清空所有错题记录吗？')) {
      setWrongRecords([]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#FDFCF0] font-sans text-slate-800 p-4 md:p-8">
      {/* --- Main Container --- */}
      <div className="max-w-4xl mx-auto space-y-8 no-print">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border-b-4 border-yellow-400">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-400 p-3 rounded-2xl">
              <BookOpen className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">数学错题举一反三打印机</h1>
              <p className="text-slate-500 text-sm">三年级数学同步练习</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center gap-1 text-orange-500 font-bold text-xl">
                <Trophy className="w-5 h-5" />
                <span>{streak}</span>
              </div>
              <p className="text-xs text-slate-400">连对次数</p>
            </div>
          </div>
        </header>

        {/* Mode Indicator */}
        <AnimatePresence>
          {isReviewMode && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-orange-100 border-2 border-orange-400 text-orange-700 px-6 py-3 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-2 font-bold">
                <RotateCcw className="w-5 h-5 animate-spin-slow" />
                <span>举一反三模式：正在攻克同类题 ({2 - reviewQueue.length + 1}/2)</span>
              </div>
              <span className="text-sm opacity-70">全部答对后恢复正常练习</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Problem Area */}
        <main className="bg-white rounded-[40px] p-8 md:p-12 shadow-xl border-b-8 border-blue-500 relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <CheckCircle2 size={200} />
          </div>

          <div className="relative z-10 flex flex-col items-center space-y-8">
            <div className="text-center space-y-2">
              <span className="bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm font-bold">
                {currentProblem.knowledgePoint}
              </span>
            </div>

            <div className="text-6xl md:text-8xl font-black tracking-wider text-slate-800 flex items-center gap-4">
              <span>{currentProblem.num1}</span>
              <span className="text-blue-500">{currentProblem.operator}</span>
              <span>{currentProblem.num2}</span>
              <span className="text-slate-300">=</span>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="number"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-32 md:w-48 bg-slate-50 border-b-4 border-slate-200 focus:border-blue-500 outline-none text-center py-2 transition-colors"
                  placeholder="?"
                />
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 w-full max-w-xs">
              <button
                onClick={handleCheck}
                disabled={!userInput || feedback.type !== null}
                className={`w-full py-4 rounded-2xl font-bold text-xl shadow-lg transform transition-all active:scale-95 flex items-center justify-center gap-2 ${
                  !userInput || feedback.type !== null
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                检查答案
                <ArrowRight className="w-6 h-6" />
              </button>

              <div className="h-8">
                <AnimatePresence mode="wait">
                  {feedback.type && (
                    <motion.div
                      key={feedback.msg}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`flex items-center gap-2 font-bold ${
                        feedback.type === 'success' ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {feedback.type === 'success' ? <CheckCircle2 /> : <XCircle />}
                      {feedback.msg}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </main>

        {/* Wrong Records Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-end px-2">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                错题本
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {wrongRecords.length}
                </span>
              </h2>
              <p className="text-slate-400 text-sm">记录你练习中的薄弱环节</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors font-medium"
              >
                <Printer size={18} />
                打印错题
              </button>
              <button 
                onClick={clearRecords}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-red-100 rounded-xl text-red-400 hover:bg-red-50 transition-colors font-medium"
              >
                <Trash2 size={18} />
                清空
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wrongRecords.length === 0 ? (
              <div className="col-span-full bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
                还没有错题记录哦，继续保持！
              </div>
            ) : (
              wrongRecords.map((record) => (
                <div key={record.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center group hover:border-blue-200 transition-all">
                  <div className="space-y-1">
                    <div className="text-xs text-slate-400 font-medium">{record.problem.knowledgePoint}</div>
                    <div className="text-2xl font-bold text-slate-700">
                      {record.problem.num1} {record.problem.operator} {record.problem.num2} = ?
                    </div>
                    <div className="flex gap-3 text-sm">
                      <span className="text-red-400 line-through">你的答案: {record.userAnswer}</span>
                      <span className="text-green-500 font-bold">正确答案: {record.problem.answer}</span>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="text-[10px] text-slate-300">
                      {new Date(record.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* --- Print Only Section --- */}
      <div className="hidden print:block print-container">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">数学错题集</h1>
          <p className="text-slate-500">姓名: ___________  日期: {new Date().toLocaleDateString()}  得分: ___________</p>
        </div>
        
        <div className="grid grid-cols-2 gap-x-12 gap-y-8">
          {wrongRecords.map((record, index) => (
            <div key={record.id} className="border-b border-slate-300 pb-4">
              <div className="text-sm text-slate-500 mb-1">第 {index + 1} 题 ({record.problem.knowledgePoint})</div>
              <div className="text-2xl font-serif mb-2">
                {record.problem.num1} {record.problem.operator} {record.problem.num2} = ________
              </div>
              <div className="text-xs text-slate-400 italic">
                (原错答案: {record.userAnswer} | 正确答案: {record.problem.answer})
              </div>
            </div>
          ))}
        </div>

        {wrongRecords.length === 0 && (
          <p className="text-center text-slate-400 mt-20">暂无错题记录</p>
        )}

        <footer className="mt-20 pt-8 border-t border-slate-200 text-center text-sm text-slate-400">
          由“数学错题举一反三打印机”生成
        </footer>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 0 !important; }
          .print-container { display: block !important; padding: 20px; }
        }
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
