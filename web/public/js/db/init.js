/**
 * SQL.js 初期化モジュール
 *
 * sql.js (SQLite WASM) を使用してブラウザ内で SQLite データベースを読み込む
 */

let db = null;

/**
 * SQL.js を初期化し、SQLite データベースを読み込む
 * @param {function} onProgress - 進捗コールバック
 * @returns {Promise<object>} データベースオブジェクト
 */
export async function initDatabase(onProgress) {
  onProgress?.('SQL.js をロード中...');

  // sql.js を動的にロード
  const initSqlJs = await loadSqlJs();

  onProgress?.('SQL.js を初期化中...');

  // SQL.js インスタンスを生成
  const SQL = await initSqlJs({
    locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.11.0/${file}`,
  });

  onProgress?.('データベースファイルを取得中...');

  // SQLite ファイルを取得
  const response = await fetch('../../data/uma.db');
  if (!response.ok) {
    throw new Error(`データベースファイルの取得に失敗しました: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();

  onProgress?.('データベースを開いています...');

  // データベースを開く
  db = new SQL.Database(new Uint8Array(buffer));

  onProgress?.('準備完了');

  return db;
}

/**
 * sql.js ライブラリを動的にロード
 * @returns {Promise<function>} initSqlJs 関数
 */
async function loadSqlJs() {
  return new Promise((resolve, reject) => {
    if (window.initSqlJs) {
      resolve(window.initSqlJs);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.11.0/sql-wasm.js';
    script.onload = () => {
      if (window.initSqlJs) {
        resolve(window.initSqlJs);
      } else {
        reject(new Error('sql.js のロードに失敗しました'));
      }
    };
    script.onerror = () => reject(new Error('sql.js スクリプトの読み込みに失敗しました'));
    document.head.appendChild(script);
  });
}

/**
 * データベースオブジェクトを取得
 * @returns {object|null} データベースオブジェクト
 */
export function getDatabase() {
  return db;
}

/**
 * クエリを実行して結果を配列で返す
 * @param {string} sql - SQL クエリ
 * @returns {Promise<Array>} 結果配列
 */
export async function query(sql) {
  if (!db) {
    throw new Error('データベースが初期化されていません');
  }

  try {
    const result = db.exec(sql);

    // 結果がない場合は空配列を返す
    if (result.length === 0) {
      return [];
    }

    // 結果をオブジェクトの配列に変換
    const { columns, values } = result[0];
    return values.map((row) => {
      const obj = {};
      columns.forEach((col, i) => {
        obj[col] = row[i];
      });
      return obj;
    });
  } catch (error) {
    console.error('SQL エラー:', sql, error);
    throw error;
  }
}
