import React, { useState } from 'react';
import { Search } from 'lucide-react';

export function SearchSection() {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Searching for:', query);
    // TODO: Connect to API catalog GET /proteins/?search=...
  };

  return (
    <div className="flex flex-col gap-4 text-sm text-slate-700 h-full">
      <h2 className="font-semibold text-xs text-slate-500 uppercase tracking-wider px-1">Explore Catalog</h2>
      
      <form onSubmit={handleSearch} className="relative mt-1">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
        <input 
          type="text"
          placeholder="Search proteins..."
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e31e24] shadow-sm text-sm bg-white"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </form>
      
      <div className="text-xs text-slate-500 mt-2 px-1">
        <p>Press Enter to search the API catalog.</p>
      </div>

      <div className="flex-1 overflow-auto mt-4 border border-slate-100 rounded-md bg-slate-50 p-4 flex flex-col items-center justify-center text-center text-slate-400">
        <Search size={32} className="mb-2 opacity-20" />
        <p>Search results will appear here</p>
      </div>
    </div>
  );
}
