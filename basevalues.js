// basevalues.js - ESM JSON Adapter for ISU SOV 2025-26
// ES Modules版として完全リニューアル

let SOV = null;

// 非同期初期化関数
export async function initSOV() {
  if (SOV) return;
  
  try {
    console.log('Attempting to fetch SOV JSON data...');
    const res = await fetch('./isu_sov_2025_26_singles_pairs.json');
    console.log('Fetch response status:', res.status, res.statusText);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    SOV = await res.json();
    console.log('SOV data loaded successfully. Elements count:', Object.keys(SOV.elements || {}).length);
  } catch (error) {
    console.error('Error loading SOV data:', error);
    throw new Error(`Failed to load SOV data: ${error.message}`);
  }
}

// SOV API関数
export function getBase(code) {
  const e = SOV?.elements?.[code];
  if (!e) throw new Error(`Unknown element code: ${code}`);
  return e.base;
}

export function getDelta(code, goe) {
  if (goe === 0) return 0;
  const e = SOV?.elements?.[code];
  if (!e) throw new Error(`Unknown element code: ${code}`);
  const d = e.goe[String(goe)];
  if (typeof d !== 'number') throw new Error(`No GOE=${goe} for ${code}`);
  return d;
}

export function getScore(code, goe) {
  const v = getBase(code) + getDelta(code, goe);
  return Math.round(v * 100) / 100;
}

// 5回転対応：指定した素ジャンプで利用可能な回転数を返す
export function getAvailableRotationsFor(baseJump) {
  if (!SOV?.elements) return [];
  const exist = new Set(Object.keys(SOV.elements));
  const letters = ['T','S','Lo','F','Lz','A'];
  if (!letters.includes(baseJump)) return [];
  const rot = [];
  for (let n=1; n<=5; n++) {
    const code = `${n}${baseJump}`;
    if ([code, `${code}q`, `${code}<`, `${code}<<`, `${code}!`].some(c => exist.has(c))) {
      rot.push(n);
    }
  }
  return rot;
}

// 既存のbasevaluesオブジェクト互換性（レガシー対応）
export const basevalues = new Proxy({}, {
  get(target, prop) {
    if (!SOV) {
      throw new Error('SOV data not loaded. Call initSOV() first.');
    }
    
    // ジャンプ要素 (配列形式でアクセス)
    if (['A', 'T', 'S', 'Lo', 'F', 'Lz', 'Eu'].includes(prop)) {
      return new Proxy([], {
        get(target, index) {
          if (index === 'length') {
            const available = getAvailableRotationsFor(prop);
            return available.length > 0 ? Math.max(...available) + 1 : 3;
          }
          
          const rotation = parseInt(index);
          if (isNaN(rotation) || rotation < 0) return undefined;
          if (rotation === 0) return 0.0;
          
          const code = `${rotation}${prop}`;
          try {
            return getBase(code);
          } catch (error) {
            return undefined;
          }
        }
      });
    }
    
    // ChSq（コレオシーケンス）配列形式
    if (prop === 'ChSq') {
      return new Proxy([], {
        get(target, index) {
          if (index === '0') return 0.0;
          if (index === '1') {
            try {
              return getBase('ChSq1');
            } catch {
              return 3.0;
            }
          }
          return undefined;
        }
      });
    }
    
    // スピンとステップシーケンス (オブジェクト形式でアクセス)
    if (['StSq', 'USp', 'LSp', 'CSp', 'SSp', 'CoSp'].includes(prop)) {
      return new Proxy({}, {
        get(target, level) {
          if (level === '0') return 0.0;
          
          let code;
          if (prop === 'StSq') {
            code = `${prop}${level}`;
          } else {
            if (typeof level === 'string' && level.match(/^[FC]/)) {
              const modifier = level[0];
              const actualLevel = level.slice(1);
              if (actualLevel === '0') return 0.0;
              code = `${modifier}${prop}${actualLevel}`;
            } else {
              code = `${prop}${level}`;
            }
          }
          
          try {
            return getBase(code);
          } catch (error) {
            console.warn(`Base value not found for ${code}`);
            return 0.0;
          }
        }
      });
    }
    
    return undefined;
  }
});