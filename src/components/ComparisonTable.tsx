import React, { useMemo } from 'react';
import { ComparisonResult } from '../lib/parser';
import { AlertCircle, CheckCircle2, Copy } from 'lucide-react';

interface ComparisonTableProps {
  results: ComparisonResult[];
  columnsToCompare: { a: string; b: string }[];
}

export function ComparisonTable({ results, columnsToCompare }: ComparisonTableProps) {
  
  const stats = useMemo(() => {
    const total = results.length;
    let perfectMatch = 0;
    let discrepancies = 0;
    let missing = 0;
    let fuzzyMatches = 0;

    results.forEach(r => {
      if (r.isFuzzyMatch) fuzzyMatches++;
      
      if (r.isMissingInA || r.isMissingInB) {
        missing++;
      } else if (r.hasDiscrepancies) {
        discrepancies++;
      } else {
        perfectMatch++;
      }
    });

    return { total, perfectMatch, discrepancies, missing, fuzzyMatches };
  }, [results]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-full bg-slate-200 shadow-sm rounded-sm overflow-hidden">
      {/* Header Stats */}
      <div className="grid grid-cols-5 gap-px bg-slate-200 border-b border-slate-200">
         <div className="p-4 bg-white">
           <p className="text-2xl font-light text-slate-800 mb-1">{stats.total}</p>
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Records</p>
         </div>
         <div className="p-4 bg-white">
           <p className="text-2xl font-light text-indigo-600 mb-1">{stats.fuzzyMatches}</p>
           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fuzzy Matches</p>
         </div>
         <div className="p-4 bg-white">
           <p className="text-2xl font-light text-emerald-600 mb-1 flex items-baseline gap-1">{stats.perfectMatch}</p>
           <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Perfect Match</p>
         </div>
         <div className="p-4 bg-rose-50/50 border-t-2 border-rose-500">
           <p className="text-2xl font-light text-rose-600 mb-1 flex items-baseline gap-1">{stats.discrepancies}</p>
           <p className="text-[10px] font-bold text-rose-700 uppercase tracking-widest flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Discrepancies</p>
         </div>
         <div className="p-4 bg-amber-50/50">
           <p className="text-2xl font-light text-amber-600 mb-1 flex items-baseline gap-1">{stats.missing}</p>
           <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Missing</p>
         </div>
      </div>

      {/* Table container */}
      <div className="flex-1 overflow-auto bg-white border border-slate-200 rounded-sm m-6 mt-6 pb-0">
        <table className="w-full text-sm text-left">
          <thead className="text-[10px] uppercase tracking-widest text-slate-400 bg-slate-50 sticky top-0 shadow-sm z-10 border-b border-slate-200 font-bold">
            <tr>
              <th className="px-6 py-4">Identifier (SVW ←→ BFX)</th>
              <th className="px-6 py-4 border-l border-slate-100">Status</th>
              {columnsToCompare.map((col, idx) => (
                <th key={idx} className="px-6 py-4 border-l border-slate-100 min-w-[200px]">
                  {col.a}
                  <div className="text-[9px] text-slate-400 font-normal leading-tight mt-1 truncate" title={`${col.a} (Silverware) vs ${col.b} (Blackfox)`}>
                    SVW ←→ BFX
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {results.map((item, rowIdx) => {
              if (item.isMissingInA) {
                 return (
                   <tr key={rowIdx} className="bg-amber-50/30 hover:bg-amber-50 transition-colors">
                     <td className="px-6 py-4 font-mono text-slate-800">{item.matchKey}</td>
                     <td className="px-6 py-4 border-l border-slate-100"><span className="px-2 py-1 bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-widest rounded-sm border border-amber-200">Missing from Silverware</span></td>
                     <td colSpan={columnsToCompare.length} className="px-6 py-4 border-l border-slate-100 text-amber-600 text-xs italic">Only exists in Blackfox</td>
                   </tr>
                 )
              }
              if (item.isMissingInB) {
                 return (
                  <tr key={rowIdx} className="bg-amber-50/30 hover:bg-amber-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-800">{item.matchKey}</td>
                    <td className="px-6 py-4 border-l border-slate-100"><span className="px-2 py-1 bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-widest rounded-sm border border-amber-200">Missing from Blackfox</span></td>
                    <td colSpan={columnsToCompare.length} className="px-6 py-4 border-l border-slate-100 text-amber-600 text-xs italic">Only exists in Silverware</td>
                  </tr>
                )
              }

              return (
                <tr key={rowIdx} className="hover:bg-slate-50 transition-colors relative group/row">
                  {item.hasDiscrepancies && <td className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 z-10"></td>}
                  <td className="px-6 py-4 font-mono text-slate-800 whitespace-nowrap">
                    {item.isFuzzyMatch ? (
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-700">{item.matchKey}</span>
                        <span className="px-1.5 py-0.5 rounded-sm bg-indigo-100 text-indigo-700 text-[9px] uppercase font-bold border border-indigo-200 tracking-wider">Fuzzy</span>
                      </div>
                    ) : (
                      item.matchKey
                    )}
                  </td>
                  <td className="px-6 py-4 border-l border-slate-100">
                    {item.hasDiscrepancies ? (
                      <span className="px-2 py-1 rounded-sm bg-rose-100 text-rose-700 text-[9px] font-bold uppercase tracking-widest border border-rose-200">Mismatch</span>
                    ) : (
                      <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest"><CheckCircle2 className="w-4 h-4 inline mr-1"/> Match</span>
                    )}
                  </td>
                  {columnsToCompare.map((col, colIdx) => {
                    const hasDiff = item.discrepancies.hasOwnProperty(col.a);
                    const valA = item.sourceARow?.[col.a];
                    const valB = item.sourceBRow?.[col.b];

                    return (
                      <td key={colIdx} className="px-6 py-4 min-w-[200px] align-top border-l border-slate-100">
                        {hasDiff ? (
                           <div className="flex flex-col w-full bg-white rounded-sm border-2 border-rose-500 relative shadow-sm overflow-hidden">
                             <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-rose-500 text-white text-[8px] font-bold uppercase rounded-sm tracking-widest">Conflict</div>
                             
                             <div className="bg-slate-100 border-b border-slate-200 p-2 flex justify-between items-center">
                               <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Expected (SVW)</span>
                             </div>
                             <div className="p-3">
                               <div className="flex items-center gap-2">
                                 <span className="text-xl font-mono text-rose-600 underline decoration-rose-200 underline-offset-4">{String(valA ?? '-')}</span>
                                 <button 
                                   onClick={() => handleCopy(String(valA ?? ''))}
                                   className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-sm transition-colors border border-transparent hover:border-emerald-200"
                                   title="Copy Expected Value"
                                 >
                                   <Copy className="w-4 h-4" />
                                 </button>
                               </div>
                             </div>

                             <div className="bg-slate-900 border-b border-slate-800 p-2 flex justify-between items-center">
                               <span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Actual (BFX)</span>
                             </div>
                             <div className="p-3 bg-slate-800">
                               <span className="text-lg font-mono text-white">{String(valB ?? '-')}</span>
                             </div>
                             
                           </div>
                        ) : (
                           <div className="px-2 py-1 text-sm text-slate-600 font-mono">
                             {String(valB ?? '-')}
                           </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
