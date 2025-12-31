/**
 * 検索結果抽出モジュール
 */

import type { Page } from 'playwright';
import type { SearchResult, FactorInfo } from './types.js';
import { SELECTORS } from './selectors.js';

/**
 * 検索結果テーブルから因子情報を抽出する
 * @param page Playwright Page インスタンス
 * @param searchSkills 検索対象スキル名リスト
 * @returns 検索結果配列
 */
export async function extractResults(
  page: Page,
  searchSkills: string[]
): Promise<SearchResult[]> {
  // デバッグ: テーブル構造を確認
  const debugInfo = await page.evaluate(({ tableSelector, rowSelector }) => {
    const table = document.querySelector(tableSelector);
    if (!table) return { tableFound: false, tableHTML: '', rowCount: 0 };
    const rows = table.querySelectorAll(rowSelector);
    return {
      tableFound: true,
      tableHTML: table.outerHTML.substring(0, 500),
      rowCount: rows.length,
      firstRowHTML: rows[0] ? (rows[0] as HTMLElement).outerHTML.substring(0, 300) : '',
    };
  }, { tableSelector: SELECTORS.RESULT_TABLE, rowSelector: SELECTORS.TABLE_ROW });

  console.log(`[extractResults] テーブル発見: ${debugInfo.tableFound}`);
  console.log(`[extractResults] テーブル行数: ${debugInfo.rowCount}`);
  if (debugInfo.firstRowHTML) {
    console.log(`[extractResults] 最初の行: ${debugInfo.firstRowHTML}...`);
  }

  // ページ内で JavaScript を実行して結果を抽出
  // 注意: page.evaluate 内では関数定義を避ける（tsx/esbuild の __name ラッパーがブラウザで動作しないため）
  const results = await page.evaluate(
    (params) => {
      const { tableSelector, rowSelector, userIdSelector, factorSelectors, skills } = params;
      const table = document.querySelector(tableSelector);
      if (!table) return [];

      const rows = table.querySelectorAll(rowSelector);
      const extractedResults = [];

      for (const row of rows) {
        // ユーザー ID
        const userIdEl = row.querySelector(userIdSelector);
        const userId = userIdEl?.textContent?.trim() ?? '';
        if (!userId) continue;

        // 青因子を抽出（インライン処理）
        const blueDaihyo: string[] = [];
        const blueSo: string[] = [];
        row.querySelectorAll(factorSelectors.BLUE).forEach((el) => {
          const text = el.textContent?.trim() ?? '';
          if (text.includes('（代表')) {
            blueDaihyo.push(text);
          } else {
            blueSo.push(text);
          }
        });
        const blueFactor = { daihyo: blueDaihyo, so: blueSo };

        // 赤因子を抽出（インライン処理）
        const redDaihyo: string[] = [];
        const redSo: string[] = [];
        row.querySelectorAll(factorSelectors.RED).forEach((el) => {
          const text = el.textContent?.trim() ?? '';
          if (text.includes('（代表')) {
            redDaihyo.push(text);
          } else {
            redSo.push(text);
          }
        });
        const redFactor = { daihyo: redDaihyo, so: redSo };

        // 緑因子を抽出（インライン処理）
        const greenDaihyo: string[] = [];
        const greenSo: string[] = [];
        row.querySelectorAll(factorSelectors.GREEN).forEach((el) => {
          const text = el.textContent?.trim() ?? '';
          if (text.includes('（代表')) {
            greenDaihyo.push(text);
          } else {
            greenSo.push(text);
          }
        });
        const greenFactor = { daihyo: greenDaihyo, so: greenSo };

        // 白因子数（「白数30」形式から抽出）
        const whiteCountMatch = row.textContent?.match(/白数(\d+)/);
        const whiteFactorCount = whiteCountMatch ? parseInt(whiteCountMatch[1], 10) : 0;

        // 白因子と代表因子数（インライン処理）
        let daihyoCount = 0;
        const whiteFactors: string[] = [];
        const whiteSelectors = [factorSelectors.WHITE_SKILL, factorSelectors.WHITE_RACE, factorSelectors.WHITE_SCENARIO];
        for (let i = 0; i < whiteSelectors.length; i++) {
          const selector = whiteSelectors[i];
          row.querySelectorAll(selector).forEach((el) => {
            const text = el.textContent?.trim() ?? '';
            whiteFactors.push(text);
            if (text.includes('（代表')) {
              daihyoCount++;
            }
          });
        }

        // 検索対象スキルの因子値を抽出（インライン処理）
        const searchSkillValues: Record<string, string> = {};
        for (let i = 0; i < skills.length; i++) {
          const skillName = skills[i];
          let foundValue = '';
          for (let j = 0; j < whiteFactors.length; j++) {
            if (whiteFactors[j].includes(skillName)) {
              // 因子名を除去して数値部分のみ取得
              foundValue = whiteFactors[j].replace(skillName, '').trim();
              break;
            }
          }
          searchSkillValues[skillName] = foundValue;
        }

        extractedResults.push({
          userId,
          blueFactor,
          redFactor,
          greenFactor,
          whiteFactorCount,
          daihyoCount,
          searchSkillValues,
        });
      }

      return extractedResults;
    },
    {
      tableSelector: SELECTORS.RESULT_TABLE,
      rowSelector: SELECTORS.TABLE_ROW,
      userIdSelector: SELECTORS.USER_ID,
      factorSelectors: SELECTORS.FACTOR,
      skills: searchSkills,
    }
  );

  return results as SearchResult[];
}

/**
 * 検索結果の総件数を取得する
 * @param page Playwright Page インスタンス
 * @returns 検索結果件数
 */
export async function extractResultCount(page: Page): Promise<number> {
  try {
    // 「検索結果 (100 件)」のようなテキストから件数を抽出
    const countText = await page.textContent('text=/検索結果.*件/');
    if (countText) {
      const match = countText.match(/(\d+)\s*件/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    return 0;
  } catch {
    return 0;
  }
}
