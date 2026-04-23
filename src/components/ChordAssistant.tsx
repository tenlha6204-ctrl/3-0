import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Sparkles, Loader2, Search } from 'lucide-react';

interface ChordAssistantProps {
  onChordFound: (frets: number[]) => void;
}

export const ChordAssistant: React.FC<ChordAssistantProps> = ({ onChordFound }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findChord = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find the guitar fret positions for the chord: ${query}. Return the positions for 6 strings (from high-e to low-E) as an array of 6 integers. Use -1 for open strings and -2 for muted strings. Example: G Major is [3, 0, 0, 0, 2, 3] (wait, standard order is usually low to high or high to low. Let's use low-E (string 5) to high-e (string 0): [3, 2, 0, 0, 0, 3]).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              frets: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER },
                description: "Array of 6 integers representing fret positions from string 0 (high-e) to string 5 (low-E)."
              },
              chordName: { type: Type.STRING }
            },
            required: ["frets"]
          }
        }
      });

      const data = JSON.parse(response.text);
      if (data.frets && data.frets.length === 6) {
        // The prompt asked for high-e to low-E, which matches our index 0-5
        onChordFound(data.frets);
      } else {
        throw new Error("Invalid chord data received");
      }
    } catch (err) {
      console.error(err);
      setError("Could not find chord. Try something like 'C Major' or 'G7'.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="relative group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-neutral-500 group-focus-within:text-orange-500 transition-colors" />
          )}
        </div>
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && findChord()}
          placeholder="Ask AI for a chord (e.g. Dm7)"
          className="w-full bg-neutral-900 border border-neutral-800 rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all placeholder:text-neutral-600"
        />
        <button 
          onClick={findChord}
          disabled={isLoading}
          className="absolute right-2 top-1.5 bottom-1.5 px-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black text-xs font-bold rounded-full flex items-center gap-2 transition-all"
        >
          <Sparkles size={14} />
          <span>Learn</span>
        </button>
      </div>
      {error && (
        <motion.p 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] text-red-500 font-mono text-center"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};
