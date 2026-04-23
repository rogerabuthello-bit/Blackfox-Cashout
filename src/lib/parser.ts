import Papa from 'papaparse';

export interface ParsedData {
  headers: string[];
  rows: Record<string, any>[];
}

export function parseCSVOrTSV(text: string): ParsedData {
  // If it's empty, return empty
  if (!text.trim()) {
    return { headers: [], rows: [] };
  }

  // Papa parse auto-detects delimiter (comma, tab, etc)
  const result = Papa.parse(text.trim(), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true, // converts numbers and booleans
  });

  return {
    headers: result.meta.fields || [],
    rows: result.data as Record<string, any>[],
  };
}

export function parseFile(file: File): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        resolve({
          headers: results.meta.fields || [],
          rows: results.data as Record<string, any>[],
        });
      },
      error: (error) => reject(error),
    });
  });
}

// Compare two datasets and find discrepancies
export interface ComparisonResult {
  matchKey: string;
  sourceARow: Record<string, any> | null;
  sourceBRow: Record<string, any> | null;
  discrepancies: Record<string, { a: any; b: any }>;
  isMissingInA: boolean;
  isMissingInB: boolean;
  hasDiscrepancies: boolean;
  isFuzzyMatch?: boolean;
}

export function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function similarity(a: string, b: string): number {
  const dist = levenshteinDistance(a.toLowerCase(), b.toLowerCase());
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return (maxLen - dist) / maxLen;
}

export function compareDatasets(
  dataA: ParsedData, // e.g. Silverware
  dataB: ParsedData, // e.g. Blackfox
  joinKeyA: string,
  joinKeyB: string,
  columnsToCompare: { a: string; b: string }[],
  useFuzzy: boolean = true
): ComparisonResult[] {
  const results: ComparisonResult[] = [];
  const bRowsPool = [...dataB.rows];

  dataA.rows.forEach(rowA => {
    const keyA = String(rowA[joinKeyA] || '').trim();
    if (!keyA) return;

    // Try exact match first
    let matchedIdx = bRowsPool.findIndex(
      rowB => String(rowB[joinKeyB] || '').trim().toLowerCase() === keyA.toLowerCase()
    );

    let isFuzzyMatch = false;
    let bKeyText = '';

    // If not exact and using fuzzy, try fuzzy match
    if (matchedIdx === -1 && useFuzzy) {
      let bestScore = 0;
      let bestIdx = -1;
      bRowsPool.forEach((rowB, i) => {
        const kb = String(rowB[joinKeyB] || '').trim();
        const score = similarity(keyA, kb);
        if (score > bestScore) {
          bestScore = score;
          bestIdx = i;
        }
      });
      // threshold of 0.65 is usually good for minor typos in names (e.g. John D vs Jon D)
      if (bestScore > 0.65) {
        matchedIdx = bestIdx;
        isFuzzyMatch = true;
      }
    }

    if (matchedIdx !== -1) {
      const rowB = bRowsPool.splice(matchedIdx, 1)[0];
      bKeyText = String(rowB[joinKeyB] || '').trim();
      
      const discrepancies: Record<string, { a: any; b: any }> = {};
      let hasDiscrepancies = false;

      // Compare mapped columns
      columnsToCompare.forEach(colPair => {
        let valA = rowA[colPair.a];
        let valB = rowB[colPair.b];

        // Normalize numeric comparisons
        if (typeof valA === 'number' || typeof valB === 'number') {
           const numA = Number(valA) || 0;
           const numB = Number(valB) || 0;
           // floating point fuzzy match for currency (within 0.01)
           if (Math.abs(numA - numB) > 0.01) {
             discrepancies[colPair.a] = { a: valA, b: valB };
             hasDiscrepancies = true;
           }
        } 
        // String comparison
        else {
          const strA = String(valA || '').trim().toLowerCase();
          const strB = String(valB || '').trim().toLowerCase();
          if (strA !== strB) {
            discrepancies[colPair.a] = { a: valA, b: valB };
            hasDiscrepancies = true;
          }
        }
      });

      results.push({
        matchKey: isFuzzyMatch ? `${keyA} ≈ ${bKeyText}` : keyA,
        sourceARow: rowA,
        sourceBRow: rowB,
        discrepancies,
        isMissingInA: false,
        isMissingInB: false,
        hasDiscrepancies,
        isFuzzyMatch,
      });
    } else {
      results.push({
        matchKey: keyA,
        sourceARow: rowA,
        sourceBRow: null,
        discrepancies: {},
        isMissingInA: false,
        isMissingInB: true,
        hasDiscrepancies: true,
      });
    }
  });

  // Remaining B rows are missing from A
  bRowsPool.forEach(rowB => {
    const keyB = String(rowB[joinKeyB] || '').trim();
    if (keyB) {
      results.push({
        matchKey: keyB,
        sourceARow: null,
        sourceBRow: rowB,
        discrepancies: {},
        isMissingInA: true,
        isMissingInB: false,
        hasDiscrepancies: true,
      });
    }
  });

  return results;
}
