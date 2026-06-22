import { useState, useRef, useEffect } from "react";

interface SearchMessagesProps {
  onSearch: (query: string) => void;
  onClose: () => void;
  resultCount: number;
  currentResultIndex: number;
  onNextResult: () => void;
  onPrevResult: () => void;
}

export default function SearchMessages({ 
  onSearch, 
  onClose, 
  resultCount, 
  currentResultIndex,
  onNextResult,
  onPrevResult
}: SearchMessagesProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onSearch(val);
  };

  return (
    <div className="absolute top-0 left-0 right-0 bg-white border-b border-slate-200 p-2 flex items-center gap-2 z-20 shadow-sm animate-in slide-in-from-top-2 duration-200">
      <div className="flex-1 relative flex items-center">
        <svg className="w-4 h-4 text-slate-400 absolute left-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search in conversation..."
          className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>

      {query && resultCount > 0 && (
        <div className="flex items-center gap-1 text-xs text-slate-500 px-2 shrink-0">
          <span>{currentResultIndex + 1} of {resultCount}</span>
          <div className="flex border-l border-slate-200 ml-2 pl-2">
            <button onClick={onPrevResult} className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-blue-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button onClick={onNextResult} className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-blue-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {query && resultCount === 0 && (
        <span className="text-xs text-slate-500 px-2 shrink-0">No results</span>
      )}

      <button 
        onClick={onClose}
        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
