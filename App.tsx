import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, Category } from './types';
import { parseAudioTransaction, AIParseResult } from './services/geminiService';
import TransactionList from './components/TransactionList';
import VoiceRecorder from './components/VoiceRecorder';
import PieChartComponent from './components/PieChartComponent';
import Modal from './components/Modal';
import { LayoutDashboard, List, Check, Loader2, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<AIParseResult | null>(null);
  const [view, setView] = useState<'dashboard' | 'list'>('dashboard');

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('transactions');
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load transactions", e);
      }
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const handleAudioRecord = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // Convert Blob to Base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        try {
          const result = await parseAudioTransaction(base64data);
          setPendingTransaction(result);
          setShowConfirmModal(true);
        } catch (error) {
          console.error("Processing failed", error);
          alert("无法识别语音内容，请重试。");
        } finally {
          setIsProcessing(false);
        }
      };
    } catch (e) {
      setIsProcessing(false);
      console.error(e);
    }
  };

  const confirmTransaction = () => {
    if (pendingTransaction) {
      const newTx: Transaction = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        ...pendingTransaction
      };
      setTransactions(prev => [newTx, ...prev]);
      setShowConfirmModal(false);
      setPendingTransaction(null);
    }
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Calculate totals
  const totalExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="min-h-screen bg-slate-50 pb-32 relative">
      {/* Header - VISUAL CHANGE: V9 Emerald Theme */}
      <header className="bg-primary-900 border-b border-primary-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-primary-900/50">
              V9
            </div>
            <h1 className="font-bold text-xl text-white tracking-tight">VoiceLedger</h1>
          </div>
          
          <div className="flex bg-primary-800 p-1 rounded-lg">
            <button 
              onClick={() => setView('dashboard')}
              className={`p-2 rounded-md transition-all ${view === 'dashboard' ? 'bg-primary-600 text-white shadow-sm' : 'text-primary-200 hover:text-white'}`}
            >
              <LayoutDashboard size={20} />
            </button>
            <button 
              onClick={() => setView('list')}
              className={`p-2 rounded-md transition-all ${view === 'list' ? 'bg-primary-600 text-white shadow-sm' : 'text-primary-200 hover:text-white'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {/* Balance Card - VISUAL CHANGE: V9 Emerald Gradient */}
        <div className="bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 rounded-2xl p-6 text-white shadow-xl shadow-primary-900/20 border border-primary-700">
          <p className="text-primary-100 text-sm font-medium mb-1">总资产 (Total Balance)</p>
          <h2 className="text-4xl font-bold mb-6 tracking-tight">¥{balance.toFixed(2)}</h2>
          <div className="flex items-center gap-8">
            <div>
              <div className="flex items-center gap-1 text-primary-200 text-xs mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                收入 (Income)
              </div>
              <p className="font-semibold text-lg text-emerald-300">+¥{totalIncome.toFixed(2)}</p>
            </div>
            <div>
              <div className="flex items-center gap-1 text-primary-200 text-xs mb-1">
                <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                支出 (Expense)
              </div>
              <p className="font-semibold text-lg text-rose-300">-¥{totalExpense.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PieChartComponent transactions={transactions} />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">最近交易 (Recent)</h3>
                <button 
                  onClick={() => setView('list')}
                  className="text-primary-600 text-sm font-medium hover:underline"
                >
                  查看全部
                </button>
              </div>
              <TransactionList transactions={transactions.slice(0, 5)} onDelete={deleteTransaction} />
            </div>
          </div>
        )}

        {view === 'list' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-lg font-bold text-slate-800 mb-4">所有交易 (All Transactions)</h3>
            <TransactionList transactions={transactions} onDelete={deleteTransaction} />
          </div>
        )}
      </main>

      {/* Voice Recorder Controls */}
      <VoiceRecorder 
        onRecordingComplete={handleAudioRecord} 
        isProcessing={isProcessing}
      />

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-40 bg-primary-900/60 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <div className="bg-white p-4 rounded-full mb-4 shadow-lg shadow-primary-500/50">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
          <p className="font-medium text-lg animate-pulse">正在分析语音 (AI Thinking)...</p>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="确认交易详情"
      >
        {pendingTransaction && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold">描述</label>
                <input 
                  type="text" 
                  value={pendingTransaction.description}
                  onChange={(e) => setPendingTransaction({...pendingTransaction, description: e.target.value})}
                  className="w-full bg-transparent text-lg font-semibold text-slate-800 focus:outline-none border-b border-transparent focus:border-primary-300 transition-colors"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold">金额</label>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400 font-bold">¥</span>
                    <input 
                      type="number" 
                      value={pendingTransaction.amount}
                      onChange={(e) => setPendingTransaction({...pendingTransaction, amount: parseFloat(e.target.value)})}
                      className="w-full bg-transparent text-lg font-semibold text-slate-800 focus:outline-none border-b border-transparent focus:border-primary-300 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase font-bold">日期</label>
                  <input 
                    type="date" 
                    value={pendingTransaction.date}
                    onChange={(e) => setPendingTransaction({...pendingTransaction, date: e.target.value})}
                    className="w-full bg-transparent text-lg font-semibold text-slate-800 focus:outline-none border-b border-transparent focus:border-primary-300 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase font-bold">分类</label>
                <select 
                  value={pendingTransaction.category}
                  onChange={(e) => setPendingTransaction({...pendingTransaction, category: e.target.value as Category})}
                  className="w-full bg-transparent text-base font-medium text-slate-800 focus:outline-none py-1"
                >
                  {Object.values(Category).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                 <label className="text-xs text-slate-400 uppercase font-bold">类型</label>
                 <div className="flex gap-2 mt-1">
                    <button 
                        onClick={() => setPendingTransaction({...pendingTransaction, type: TransactionType.EXPENSE})}
                        className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all ${pendingTransaction.type === TransactionType.EXPENSE ? 'bg-red-100 text-red-700 ring-2 ring-red-200 shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                        支出 (Expense)
                    </button>
                    <button 
                        onClick={() => setPendingTransaction({...pendingTransaction, type: TransactionType.INCOME})}
                        className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium transition-all ${pendingTransaction.type === TransactionType.INCOME ? 'bg-green-100 text-green-700 ring-2 ring-green-200 shadow-sm' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                        收入 (Income)
                    </button>
                 </div>
              </div>
            </div>

            <button
              onClick={confirmTransaction}
              className="w-full bg-primary-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-primary-500/30 hover:bg-primary-700 transform transition active:scale-95 flex items-center justify-center gap-2"
            >
              <Check size={20} />
              保存交易
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default App;