// basevalues.js - JSON Adapter for ISU SOV 2025-26
// Maintains backwards compatibility with existing script.js calls

let SOV = null;

// 非同期初期化関数
async function initSOV() {
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

// SOV APIの関数
function getBase(code) {
  const e = SOV?.elements?.[code];
  if (!e) throw new Error(`Unknown element code: ${code}`);
  return e.base;
}

function getDelta(code, goe) {
  if (goe === 0) return 0;
  const e = SOV?.elements?.[code];
  if (!e) throw new Error(`Unknown element code: ${code}`);
  const key = String(goe);
  const d = e.goe[key];
  if (typeof d !== 'number') throw new Error(`No GOE=${key} for ${code}`);
  return d;
}

function getScore(code, goe) {
  const v = getBase(code) + getDelta(code, goe);
  return Math.round(v * 100) / 100; // 小数第2位で丸める
}

// 5回転対応：指定した素ジャンプで利用可能な回転数を返す
function getAvailableRotationsFor(baseJump) {
  if (!SOV?.elements) return [];
  const exist = new Set(Object.keys(SOV.elements));
  const available = [];
  
  const maxRotations = baseJump === 'Eu' ? 2 : baseJump === 'A' ? 4 : 5;
  
  for (let n = 1; n <= maxRotations; n++) {
    const code = `${n}${baseJump}`;
    // 素の要素コードまたは派生形が存在するかチェック
    if ([code, `${code}q`, `${code}<`, `${code}<<`, `${code}!`].some(c => exist.has(c))) {
      available.push(n);
    }
  }
  return available;
}

// 既存のbasevaluesオブジェクトの互換性を保つためのプロキシ
const basevalues = new Proxy({}, {
  get(target, prop) {
    if (!SOV) {
      throw new Error('SOV data not loaded. Call initSOV() first.');
    }
    
    // ジャンプ要素 (配列形式でアクセス)
    if (['A', 'T', 'S', 'Lo', 'F', 'Lz', 'Eu'].includes(prop)) {
      return new Proxy([], {
        get(target, index) {
          if (index === 'length') {
            // 利用可能な回転数の最大値+1を返す
            const available = getAvailableRotationsFor(prop);
            return available.length > 0 ? Math.max(...available) + 1 : 3;
          }
          
          const rotation = parseInt(index);
          if (isNaN(rotation) || rotation < 0) return undefined;
          
          if (rotation === 0) return 0.0; // 0回転は0点
          
          const code = `${rotation}${prop}`;
          try {
            return getBase(code);
          } catch (error) {
            return undefined; // 存在しない場合はundefined
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
              return 3.0; // フォールバック
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
            // スピンの場合、F（フライング）やC（コンビネーション）プレフィックスを処理
            if (typeof level === 'string' && level.match(/^[FC]/)) {
              const modifier = level[0]; // F または C
              const actualLevel = level.slice(1); // レベル部分
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
            return 0.0; // 見つからない場合は0を返す
          }
        }
      });
    }
    
    return undefined;
  }
});

// グローバルに公開（既存コードとの互換性のため）
if (typeof window !== 'undefined') {
  window.initSOV = initSOV;
  window.getBase = getBase;
  window.getDelta = getDelta;
  window.getScore = getScore;
  window.getAvailableRotationsFor = getAvailableRotationsFor;
  window.basevalues = basevalues;
}