import React, { useState } from 'react';
import { ExternalLink, RefreshCw, AlertCircle, FileSpreadsheet, ClipboardPaste } from 'lucide-react';
import { parseFile, parseCSVOrTSV, compareDatasets, ParsedData, ComparisonResult } from './lib/parser';
import { cn } from './lib/utils';
import { ComparisonTable } from './components/ComparisonTable';

export default function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'map' | 'results'>('upload');
  
  const [silverwareData, setSilverwareData] = useState<ParsedData | null>(null);
  const [blackfoxData, setBlackfoxData] = useState<ParsedData | null>(null);
  const [blackfoxInputText, setBlackfoxInputText] = useState('');

  const [joinKeyA, setJoinKeyA] = useState<string>('');
  const [joinKeyB, setJoinKeyB] = useState<string>('');
  const [useFuzzy, setUseFuzzy] = useState(true);
  const [columnsToCompare, setColumnsToCompare] = useState<{a: string, b: string}[]>([]);

  const [results, setResults] = useState<ComparisonResult[] | null>(null);

  const handleSilverwareUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const data = await parseFile(e.target.files[0]);
        setSilverwareData(data);
      } catch (err) {
        console.error(err);
        alert('Failed to parse Silverware file.');
      }
    }
  };

  const handleBlackfoxParseText = () => {
    try {
      const data = parseCSVOrTSV(blackfoxInputText);
      setBlackfoxData(data);
    } catch (err) {
      console.error(err);
      alert('Failed to parse Blackfox text.');
    }
  };

  const handleBlackfoxUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const data = await parseFile(e.target.files[0]);
        setBlackfoxData(data);
      } catch (err) {
        console.error(err);
        alert('Failed to parse Blackfox file.');
      }
    }
  };

  const performComparison = () => {
    if (!silverwareData || !blackfoxData || !joinKeyA || !joinKeyB) return;
    
    // Auto-map columns entirely if user didn't specify (for simplicity in demo)
    // We match columns with the same name.
    let mapped = columnsToCompare;
    if (mapped.length === 0) {
      mapped = silverwareData.headers
        .filter(h => blackfoxData.headers.includes(h) && h !== joinKeyA && h !== joinKeyB)
        .map(h => ({ a: h, b: h }));
      setColumnsToCompare(mapped);
    }

    const comparisonResults = compareDatasets(
      silverwareData,
      blackfoxData,
      joinKeyA,
      joinKeyB,
      mapped,
      useFuzzy
    );
    setResults(comparisonResults);
    setActiveTab('results');
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {/* LEFT PANEL: Blackfox Web App Wrapper */}
      <div className="hidden lg:flex lg:flex-col w-1/2 border-r border-slate-200 bg-white">
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between shadow-sm z-10">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></span>
            Blackfox Live Gateway
          </div>
          <div className="flex gap-2">
            <a 
              href="https://app.goblackfox.com/login" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-sm"
            >
              Open in New Tab <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <div className="relative flex-1 bg-slate-100/50">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-slate-50 opacity-90 z-0">
             <AlertCircle className="w-12 h-12 text-slate-400 mb-4" />
             <h3 className="text-lg font-medium text-slate-700 mb-2">Browser Security Notice</h3>
             <p className="text-sm text-slate-500 max-w-sm">
               Due to cross-origin security rules, the validator cannot "see" inside the Blackfox app. 
               Copy the cashout table from Blackfox and paste it into the panel on the right to find discrepancies.
             </p>
          </div>
          {/* We keep the iframe above the placeholder in case X-Frame-Options allows it */}
          <iframe 
            src="https://app.goblackfox.com/login" 
            className="w-full h-full border-0 relative z-10"
            title="Blackfox App"
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        </div>
      </div>

      {/* RIGHT PANEL: Discrepancy Engine */}
      <div className="w-full lg:w-1/2 flex flex-col h-full bg-slate-50 relative shadow-xl z-20 border-l border-slate-200">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 flex items-center justify-center rounded-sm font-bold text-white">BF</div>
            <h1 className="text-lg font-semibold tracking-tight text-slate-800">Verification Suite</h1>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded border border-slate-200 ml-2 hidden sm:inline-block">Validator Engine</span>
          </div>
        </header>

        <div className="flex border-b border-slate-200 bg-white shadow-sm z-10">
          {['upload', 'map', 'results'].map(step => (
            <button
              key={step}
              onClick={() => setActiveTab(step as any)}
              className={cn(
                "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-colors",
                activeTab === step 
                  ? "border-indigo-600 text-indigo-600 bg-slate-50" 
                  : "border-transparent text-slate-400 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              Step {step === 'upload' ? '1: Load Data' : step === 'map' ? '2: Map Columns' : '3: Results'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {activeTab === 'upload' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Silverware Upload */}
              <div className="p-6 bg-white border border-slate-200 rounded-sm shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                <div className="flex items-center gap-3 mb-6">
                  <div>
                    <h2 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-1">Data Source A</h2>
                    <p className="text-lg font-medium text-slate-800">Silverware Expected Cashout</p>
                  </div>
                </div>
                
                <input 
                  type="file" 
                  accept=".csv,.txt" 
                  onChange={handleSilverwareUpload}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-colors"
                />
                {silverwareData && (
                  <div className="mt-4 text-[11px] font-bold text-emerald-700 bg-emerald-50 p-3 rounded-sm border-l-2 border-emerald-500">
                    Loaded {silverwareData.rows.length} rows with {silverwareData.headers.length} columns.
                  </div>
                )}
              </div>

              {/* Blackfox Upload/Paste */}
              <div className="p-6 bg-white border border-slate-200 rounded-sm shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-800"></div>
                <div className="flex items-center gap-3 mb-6">
                  <div>
                    <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Data Source B</h2>
                    <p className="text-lg font-medium text-slate-800">Blackfox Actual Records</p>
                  </div>
                </div>
                
                <textarea
                  value={blackfoxInputText}
                  onChange={e => setBlackfoxInputText(e.target.value)}
                  placeholder="Paste rows from Blackfox here..."
                  className="w-full h-32 p-4 text-sm border border-slate-200 rounded-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none font-mono text-slate-700 bg-slate-50 mb-3"
                />
                
                <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                  <button 
                    onClick={handleBlackfoxParseText}
                    className="px-4 py-2 bg-slate-800 text-white text-xs font-bold uppercase tracking-widest rounded-sm shadow-sm hover:bg-slate-900 transition"
                  >
                    Parse Text First
                  </button>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-4">OR UPLOAD CSV</span>
                  <input 
                    type="file" 
                    accept=".csv,.txt" 
                    onChange={handleBlackfoxUpload}
                    className="block text-sm text-slate-500 file:mr-2 file:py-2 file:px-4 file:rounded-sm file:border-0 file:text-xs file:font-bold file:uppercase file:tracking-wider file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 transition-colors"
                  />
                </div>
                
                {blackfoxData && (
                  <div className="mt-4 text-[11px] font-bold text-indigo-700 bg-indigo-50 p-3 rounded-sm border-l-2 border-indigo-500">
                    Loaded {blackfoxData.rows.length} rows with {blackfoxData.headers.length} columns.
                  </div>
                )}
              </div>

              <div className="pt-6 flex justify-end">
                <button 
                  disabled={!silverwareData || !blackfoxData}
                  onClick={() => setActiveTab('map')}
                  className="px-8 py-3 bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest rounded-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                >
                  Continue to Mapping
                </button>
              </div>

            </div>
          )}

          {activeTab === 'map' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {!silverwareData || !blackfoxData ? (
                <div className="text-center p-8 bg-white rounded-sm border border-slate-200">
                  <p className="text-sm text-slate-500">Please load both datasets first before configuring mapping.</p>
                  <button onClick={() => setActiveTab('upload')} className="mt-4 text-indigo-600 font-bold text-xs uppercase tracking-widest hover:underline">Go back to Upload</button>
                </div>
              ) : (
                <>
                  <div className="p-6 bg-white border border-slate-200 rounded-sm shadow-sm">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">Unique Identifier Selection</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2">Silverware Column (Expected)</label>
                        <select 
                          className="w-full border-slate-200 rounded-sm text-sm p-2.5 bg-slate-50 focus:border-indigo-500 outline-none"
                          value={joinKeyA} 
                          onChange={e => setJoinKeyA(e.target.value)}
                        >
                          <option value="">-- Select Column --</option>
                          {silverwareData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2">Blackfox Column (Actual)</label>
                        <select 
                          className="w-full border-slate-200 rounded-sm text-sm p-2.5 bg-slate-50 focus:border-indigo-500 outline-none"
                          value={joinKeyB} 
                          onChange={e => setJoinKeyB(e.target.value)}
                        >
                          <option value="">-- Select Column --</option>
                          {blackfoxData.headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-3">
                       <input 
                         type="checkbox" 
                         id="useFuzzy" 
                         checked={useFuzzy} 
                         onChange={e => setUseFuzzy(e.target.checked)} 
                         className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                       />
                       <div>
                         <label htmlFor="useFuzzy" className="text-xs font-bold text-slate-800 cursor-pointer block">
                           Enable Smart Name Matching (Fuzzy Match)
                         </label>
                         <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Compensates for minor typos (e.g. "John D" vs "Jon D.")</p>
                       </div>
                    </div>
                  </div>

                  <div className="pt-6 flex justify-end">
                    <button 
                      disabled={!joinKeyA || !joinKeyB}
                      onClick={performComparison}
                      className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest rounded-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition"
                    >
                      <RefreshCw className="w-4 h-4" /> Run Discrepancy Engine
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'results' && (
            <div className="animate-in fade-in zoom-in-95 duration-300 h-full flex flex-col">
              {!results ? (
                 <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-200">
                   <p className="text-sm text-slate-500">No results yet.</p>
                 </div>
              ) : (
                <ComparisonTable results={results} columnsToCompare={columnsToCompare} />
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
