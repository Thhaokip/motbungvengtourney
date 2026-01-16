import React, { useState } from 'react';
import { askAiReferee } from '../services/geminiService';
import { Bot, Send, Loader2 } from 'lucide-react';

export const RuleAssistant: React.FC<{sport: string}> = ({ sport }) => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setAnswer(null);
    const response = await askAiReferee(query, sport);
    setAnswer(response);
    setLoading(false);
  };

  return (
    <div className="mt-6 bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-lg p-1 border border-brand-green/30">
        <div className="bg-black/50 p-4 rounded-md">
            <div className="flex items-center gap-2 mb-3 text-brand-green">
                <Bot size={20} />
                <h4 className="font-bold font-display uppercase tracking-wider">AI Referee Assistant</h4>
            </div>
            <p className="text-xs text-gray-400 mb-4">Ask any question about {sport} rules. Powered by Gemini.</p>
            
            <form onSubmit={handleAsk} className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`e.g., Is it a foul if...`}
                    className="flex-1 bg-black border border-neutral-700 rounded px-3 py-2 text-sm text-white focus:border-brand-green outline-none"
                />
                <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-brand-green text-black px-3 rounded hover:bg-green-400 disabled:opacity-50 transition-colors"
                >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                </button>
            </form>

            {answer && (
                <div className="bg-brand-green/10 border border-brand-green/20 p-3 rounded text-sm text-gray-200 leading-relaxed animate-fade-in">
                    <span className="font-bold text-brand-green block mb-1">Referee says:</span>
                    {answer}
                </div>
            )}
        </div>
    </div>
  );
};
