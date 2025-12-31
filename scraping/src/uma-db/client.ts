/**
 * ウマ娘 DB クライアント
 */

import { chromium, type Browser, type Page } from 'playwright';
import type { SearchOptions, SkillSearchResult } from './types.js';
import { SELECTORS, UMA_DB_URL } from './selectors.js';
import { extractResults, extractResultCount } from './extractor.js';

/** デフォルトタイムアウト（ミリ秒） */
const DEFAULT_TIMEOUT = 30000;

/** ページ読み込み待機時間（ミリ秒） */
const PAGE_LOAD_WAIT = 3000;

/** 操作間の待機時間（ミリ秒） */
const ACTION_WAIT = 500;

/** 白因子下限の増加幅 */
const WHITE_FACTOR_INCREMENT = 5;

/** 検索結果の上限（この件数以上で動的調整を実行。サイトは最大100件までしか表示しない） */
const RESULT_LIMIT_THRESHOLD = 100;

/**
 * ウマ娘 DB クライアントクラス
 */
export class UmaDbClient {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private options: SearchOptions;

  constructor(options: SearchOptions) {
    this.options = {
      whiteFactor: 30,
      g1Wins: 0,
      limit: 100,
      headless: true,
      interactive: false,
      outputDir: 'results',
      ...options,
    };
  }

  /**
   * ブラウザを起動してページに遷移する
   */
  async launch(): Promise<void> {
    console.log('ブラウザを起動中...');
    this.browser = await chromium.launch({
      headless: this.options.headless,
    });

    const context = await this.browser.newContext({
      viewport: { width: 1280, height: 800 },
      locale: 'ja-JP',
    });

    this.page = await context.newPage();
    this.page.setDefaultTimeout(DEFAULT_TIMEOUT);

    console.log(`${UMA_DB_URL} に遷移中...`);
    await this.page.goto(UMA_DB_URL, { waitUntil: 'domcontentloaded' });

    // ページ読み込み完了を待機
    await this.page.waitForTimeout(PAGE_LOAD_WAIT);

    // 広告ダイアログを閉じる
    await this.dismissAdDialog();

    console.log('ページの読み込みが完了しました');
  }

  /**
   * 広告ダイアログを閉じる
   */
  private async dismissAdDialog(): Promise<void> {
    if (!this.page) return;

    console.log('[dismissAdDialog] 広告ダイアログを確認中...');

    // Funding Choices (fc-dialog) の閉じるボタンを探してクリック
    const fcCloseSelectors = [
      // Funding Choices の閉じるボタン
      '.fc-close',
      '.fc-button-label',
      'button.fc-cta-do-not-consent',
      'button.fc-cta-consent',
      '[aria-label="Close"]',
      '[aria-label="閉じる"]',
      '.fc-dialog-container button',
    ];

    for (const selector of fcCloseSelectors) {
      try {
        const button = this.page.locator(selector).first();
        if (await button.isVisible({ timeout: 1000 })) {
          await button.click({ force: true });
          console.log(`[dismissAdDialog] 広告を閉じました (${selector})`);
          await this.page.waitForTimeout(ACTION_WAIT);
          return;
        }
      } catch {
        // 次のセレクタを試行
      }
    }

    // Escape キーでダイアログを閉じる
    try {
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(ACTION_WAIT);
      console.log('[dismissAdDialog] Escape キーで広告を閉じました');
    } catch {
      // ダイアログがない場合は無視
    }

    // fc-dialog-overlay が残っている場合は強制的に削除する
    try {
      const removed = await this.page.evaluate(() => {
        const elementsToRemove = [
          '.fc-dialog-overlay',
          '.fc-message-root',
          '.fc-consent-root',
          '[class*="fc-"]',
        ];
        let removedCount = 0;
        for (const selector of elementsToRemove) {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el) => {
            el.remove();
            removedCount++;
          });
        }
        return removedCount;
      });
      if (removed > 0) {
        console.log(`[dismissAdDialog] ${removed} 個の広告要素を削除しました`);
      }
    } catch {
      // 無視
    }
  }

  /**
   * 検索条件を設定する（白因子合計数、G1勝数、検索件数）
   */
  async setSearchConditions(): Promise<void> {
    if (!this.page) {
      throw new Error('ブラウザが起動していません');
    }

    console.log('検索条件を設定中...');

    // 白因子合計数の設定
    if (this.options.whiteFactor !== undefined) {
      await this.setWhiteFactorCondition(this.options.whiteFactor);
    }

    // G1勝数の設定
    if (this.options.g1Wins !== undefined && this.options.g1Wins > 0) {
      await this.setG1WinsCondition(this.options.g1Wins);
    }

    // 検索件数の設定
    if (this.options.limit !== undefined) {
      await this.setLimitCondition(this.options.limit);
    }

    console.log('検索条件の設定が完了しました');
  }

  /**
   * 白因子合計数の条件を設定
   */
  private async setWhiteFactorCondition(value: number): Promise<void> {
    if (!this.page) return;

    try {
      const input = this.page.locator(SELECTORS.SEARCH_CONDITIONS.WHITE_FACTOR_INPUT);
      if (await input.isVisible({ timeout: 3000 })) {
        await input.fill(String(value));
        console.log(`白因子合計数: ${value} を設定しました`);
      } else {
        console.log('白因子数の入力欄が見つかりませんでした');
      }
    } catch {
      console.log('白因子数の設定をスキップ');
    }
  }

  /**
   * 白因子合計数の条件を更新する（動的調整用）
   * @param value 新しい白因子下限値
   */
  async updateWhiteFactorCondition(value: number): Promise<void> {
    await this.setWhiteFactorCondition(value);
  }

  /**
   * G1勝数の条件を設定
   */
  private async setG1WinsCondition(value: number): Promise<void> {
    if (!this.page) return;

    try {
      const input = this.page.locator(SELECTORS.SEARCH_CONDITIONS.G1_WINS_INPUT);
      if (await input.isVisible({ timeout: 3000 })) {
        await input.fill(String(value));
        console.log(`G1勝数: ${value} を設定しました`);
      } else {
        console.log('G1勝数の入力欄が見つかりませんでした');
      }
    } catch {
      console.log('G1勝数の設定をスキップ');
    }
  }

  /**
   * 検索件数の条件を設定
   */
  private async setLimitCondition(value: number): Promise<void> {
    if (!this.page) return;

    try {
      const input = this.page.locator(SELECTORS.SEARCH_CONDITIONS.SEARCH_COUNT_INPUT);
      if (await input.isVisible({ timeout: 3000 })) {
        await input.fill(String(value));
        console.log(`検索件数: ${value} を設定しました`);
      } else {
        console.log('検索件数の入力欄が見つかりませんでした');
      }
    } catch {
      console.log('検索件数の設定をスキップ');
    }
  }

  /**
   * インタラクティブモード: ユーザーの Enter 入力を待機
   */
  async waitForUserInput(): Promise<void> {
    if (!this.options.interactive) return;

    console.log('\n検索条件を設定してください。完了したら Enter を押してください...');

    return new Promise((resolve) => {
      const stdin = process.stdin;
      stdin.setRawMode?.(true);
      stdin.resume();
      stdin.once('data', () => {
        stdin.setRawMode?.(false);
        stdin.pause();
        console.log('Enter が押されました。検索を続行します...\n');
        resolve();
      });
    });
  }

  /**
   * スキルを検索する（動的白因子調整対応）
   * @param skillName 検索するスキル名
   * @returns 検索結果
   */
  async searchSkill(skillName: string): Promise<SkillSearchResult> {
    if (!this.page) {
      throw new Error('ブラウザが起動していません');
    }

    console.log(`\n「${skillName}」を検索中...`);

    // 現在の白因子下限値（初期値）
    let currentWhiteFactor = this.options.whiteFactor ?? 30;
    let totalCount = 0;

    // 採用する条件を保持（100件以上だった最後の条件）
    let adoptedWhiteFactor = currentWhiteFactor;
    let adoptedCount = 0;

    // 初回検索: スキル入力・選択・検索実行
    // 白因子条件を初期値にリセット（前回のスキル検索で変更されている可能性があるため）
    await this.updateWhiteFactorCondition(currentWhiteFactor);

    // 既存の白因子行を削除（ある場合）
    await this.clearWhiteFactorRows();

    // 白因子（共通スキル）セクションを展開
    await this.expandWhiteFactorSection();

    // スキル入力欄を探す
    const skillInput = await this.getSkillInputElement();
    if (!skillInput) {
      throw new Error(
        'スキル入力欄が見つかりません。ページ構造を確認してください。--interactive オプションを使用して手動で操作することもできます。'
      );
    }

    // スキル入力欄をクリック（ドロップダウンを開く）
    console.log(`[searchSkill] スキル選択欄をクリック中...`);
    await skillInput.click();
    await this.page.waitForTimeout(1000);

    // クリック後、入力欄が表示されるか確認
    console.log(`[searchSkill] スキル名「${skillName}」を入力中...`);
    await this.inputSkillToFieldSelect(skillName);
    await this.page.waitForTimeout(1000); // 検索結果の表示を待機

    // ドロップダウンからスキルを選択
    await this.selectSkillFromDropdown(skillName);

    // 検索を実行
    await this.executeSearch();

    // 結果件数を取得
    totalCount = await extractResultCount(this.page);
    console.log(`[searchSkill] 検索結果: ${totalCount} 件（白因子下限: ${currentWhiteFactor}）`);

    // 動的調整ループ: 結果が100件以上の場合は白因子下限を+5して再検索
    while (totalCount >= RESULT_LIMIT_THRESHOLD) {
      // 100件以上の条件を採用候補として保持
      adoptedWhiteFactor = currentWhiteFactor;
      adoptedCount = totalCount;

      console.log(`[searchSkill] 結果が ${RESULT_LIMIT_THRESHOLD} 件以上です。白因子下限を調整します...`);
      currentWhiteFactor += WHITE_FACTOR_INCREMENT;

      // 白因子条件を更新して再検索
      await this.updateWhiteFactorCondition(currentWhiteFactor);
      await this.executeSearch();

      // 結果件数を再取得
      totalCount = await extractResultCount(this.page);
      console.log(`[searchSkill] 検索結果: ${totalCount} 件（白因子下限: ${currentWhiteFactor}）`);
    }

    // 100件未満になった条件を記録
    const finalWhiteFactor = currentWhiteFactor;
    const finalCount = totalCount;

    // 採用する条件を決定
    // - 初回から100件未満の場合: その条件を採用
    // - 100件以上→100件未満になった場合: 一つ前の条件（100件以上だった条件）を採用
    if (adoptedCount === 0) {
      // 初回から100件未満だった場合
      adoptedWhiteFactor = currentWhiteFactor;
      adoptedCount = totalCount;
    } else {
      // 一つ前の条件で再検索して結果を取得
      console.log(`[searchSkill] 採用条件（白因子下限: ${adoptedWhiteFactor}）で再検索...`);
      await this.updateWhiteFactorCondition(adoptedWhiteFactor);
      await this.executeSearch();
    }

    // 結果を抽出（ページングあり）
    const allResults = await this.extractAllPagesResults([skillName]);

    console.log(`検索完了: ${adoptedCount} 件中 ${allResults.length} 件を取得（採用白因子下限: ${adoptedWhiteFactor}、探索終了白因子下限: ${finalWhiteFactor}）`);

    return {
      skillName,
      results: allResults,
      totalCount: adoptedCount,
      actualWhiteFactor: adoptedWhiteFactor,
      finalWhiteFactor,
      finalCount,
    };
  }

  /**
   * 全ページの結果を抽出
   */
  private async extractAllPagesResults(searchSkills: string[]): Promise<import('./types.js').SearchResult[]> {
    if (!this.page) return [];

    const allResults: import('./types.js').SearchResult[] = [];
    let currentPage = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      // 現在のページの結果を抽出
      const pageResults = await extractResults(this.page, searchSkills);
      allResults.push(...pageResults);
      console.log(`[ページ ${currentPage}] ${pageResults.length} 件を取得（累計: ${allResults.length} 件）`);

      // ページネーションの状態を page.evaluate で直接確認
      const paginationState = await this.page.evaluate((selector) => {
        const nextBtn = document.querySelector(selector);
        if (!nextBtn) return { found: false, disabled: true };
        const li = nextBtn.closest('li');
        return {
          found: true,
          disabled: li ? li.classList.contains('disabled') : false,
          liClass: li ? li.className : 'none',
        };
      }, SELECTORS.PAGINATION.NEXT_PAGE);

      console.log(`[extractAllPagesResults] ページネーション状態: ${JSON.stringify(paginationState)}`);

      if (!paginationState.found) {
        console.log('[extractAllPagesResults] 次ページボタンなし');
        hasNextPage = false;
        break;
      }

      const isDisabled = paginationState.disabled;

      if (isDisabled) {
        console.log('[extractAllPagesResults] 最終ページに到達');
        hasNextPage = false;
        break;
      }

      // 次ページへ移動
      const nextButton = this.page.locator(SELECTORS.PAGINATION.NEXT_PAGE).first();
      await nextButton.click();
      await this.page.waitForTimeout(500);

      // ローディング完了を待機
      try {
        await this.page.waitForSelector('.b-table-busy-slot', { state: 'hidden', timeout: 10000 });
      } catch {
        // タイムアウトは無視
      }

      await this.page.waitForTimeout(500);
      currentPage++;

      // 無限ループ防止（最大100ページ）
      if (currentPage > 100) {
        console.log('[extractAllPagesResults] 最大ページ数に達しました');
        break;
      }
    }

    return allResults;
  }

  /**
   * 既存の白因子行を削除する
   */
  private async clearWhiteFactorRows(): Promise<void> {
    if (!this.page) return;

    try {
      // 削除ボタンを探して全てクリック
      const deleteButtons = this.page.locator('button:has-text("削除")');
      const count = await deleteButtons.count();

      for (let i = 0; i < count; i++) {
        await deleteButtons.first().click();
        await this.page.waitForTimeout(ACTION_WAIT);
      }

      if (count > 0) {
        console.log(`${count} 件の白因子行を削除しました`);
      }
    } catch {
      // 削除ボタンがない場合は無視
    }
  }

  /**
   * 白因子（共通スキル）セクションにスキル選択欄を追加する
   * 「+」ボタンをクリックして新しいスキル選択欄を表示する
   */
  private async expandWhiteFactorSection(): Promise<void> {
    if (!this.page) return;

    // Step 1: 「白因子（共通スキル）」ラベルを探す
    console.log('[Step 1] ラベル「白因子（共通スキル）」を検索中...');
    const label = this.page.locator(`label:has-text("${SELECTORS.WHITE_SKILL.LABEL}")`);
    const labelVisible = await label.isVisible({ timeout: 3000 }).catch(() => false);
    if (!labelVisible) {
      console.log('[Step 1] ✗ ラベルが見つかりません');
      return;
    }
    const labelText = await label.textContent();
    console.log(`[Step 1] ✓ ラベル発見: "${labelText}"`);

    // Step 2: ラベルの親 form-group を取得
    console.log('[Step 2] ラベルの親要素（form-group）を取得中...');
    const formGroup = label.locator('..');
    const formGroupVisible = await formGroup.isVisible({ timeout: 1000 }).catch(() => false);
    if (!formGroupVisible) {
      console.log('[Step 2] ✗ 親要素が見つかりません');
      return;
    }
    const formGroupTag = await formGroup.evaluate((el) => `${el.tagName}.${el.className}`);
    console.log(`[Step 2] ✓ 親要素取得: ${formGroupTag}`);

    // Step 3: form-group 内で fa-plus アイコンを持つボタンを探す
    console.log(`[Step 3] fa-plus ボタンを検索中... (セレクタ: button:has(${SELECTORS.WHITE_SKILL.ADD_ICON}))`);
    const addButton = formGroup.locator(`button:has(${SELECTORS.WHITE_SKILL.ADD_ICON})`);
    const buttonCount = await addButton.count();
    if (buttonCount === 0) {
      console.log('[Step 3] ✗ fa-plus ボタンが見つかりません');
      // デバッグ: form-group 内のボタンを列挙
      const allButtons = formGroup.locator('button');
      const allButtonCount = await allButtons.count();
      console.log(`[Step 3] DEBUG: form-group 内のボタン総数: ${allButtonCount}`);
      for (let i = 0; i < allButtonCount; i++) {
        const btnHtml = await allButtons.nth(i).evaluate((el) => el.outerHTML.substring(0, 150));
        console.log(`[Step 3] DEBUG: ボタン${i}: ${btnHtml}...`);
      }
      return;
    }
    console.log(`[Step 3] ✓ fa-plus ボタン発見 (${buttonCount}個)`);

    // Step 3.5: 広告オーバーレイがクリックを妨げていないか確認
    console.log('[Step 3.5] 広告オーバーレイを確認・除去中...');
    await this.dismissAdDialog();

    // Step 4: ボタンをクリック
    console.log('[Step 4] ボタンをクリック中...');
    try {
      await addButton.first().click({ timeout: 10000 });
      console.log('[Step 4] ✓ クリック成功');
    } catch (error) {
      console.log(`[Step 4] ✗ クリック失敗: ${error instanceof Error ? error.message : error}`);
      return;
    }

    // クリック後の待機
    await this.page.waitForTimeout(1000);

    // Step 5: コンテナ内の状態を確認
    console.log('[Step 5] #common_factor_skill コンテナの内容を確認中...');
    const container = this.page.locator(SELECTORS.WHITE_SKILL.CONTAINER);
    const containerHTML = await container.evaluate((el) => el.innerHTML);
    if (containerHTML.trim()) {
      console.log(`[Step 5] ✓ スキル選択欄が表示されました: ${containerHTML.substring(0, 150)}...`);
    } else {
      console.log('[Step 5] ✗ コンテナは空のままです');
    }
  }

  /**
   * スキル入力欄を取得（検索ボックス）
   * ※ 最初の select は星数選択なので、スキル入力は別の要素
   */
  private async getSkillInputElement(): Promise<import('playwright').Locator | null> {
    if (!this.page) return null;

    const container = this.page.locator(SELECTORS.WHITE_SKILL.CONTAINER);

    // デバッグ: コンテナ内の全構造を確認
    console.log('[getSkillInputElement] コンテナ内の構造を確認中...');
    const containerHTML = await container.evaluate((el) => el.innerHTML);
    console.log(`[getSkillInputElement] コンテナHTML (500文字): ${containerHTML.substring(0, 500)}...`);

    // コンテナ内のカラム数を確認
    const columns = container.locator('.col-4, .col-8, [class*="col-"]');
    const colCount = await columns.count();
    console.log(`[getSkillInputElement] カラム数: ${colCount}`);

    // 各カラムの内容を確認
    for (let i = 0; i < colCount; i++) {
      const colHTML = await columns.nth(i).evaluate((el) => el.innerHTML.substring(0, 100));
      console.log(`[getSkillInputElement] col[${i}]: ${colHTML}...`);
    }

    // スキル入力欄を探す（input または検索可能なコンポーネント）
    const inputSelectors = [
      // gb-field-select コンポーネント（ウマ娘 DB 独自）
      '.gb-field-select__field',
      '.gb-field-select',
      // 入力欄
      'input[type="text"]',
      'input[type="search"]',
      'input:not([type])',
      // vue-select の検索ボックス
      '.vs__search',
      // カスタム入力欄
      '[contenteditable="true"]',
      // 検索関連のクラス
      '[class*="search"]',
      '[class*="input"]',
    ];

    for (const selector of inputSelectors) {
      try {
        const elements = container.locator(selector);
        const count = await elements.count();
        if (count > 0) {
          for (let i = 0; i < count; i++) {
            const el = elements.nth(i);
            if (await el.isVisible({ timeout: 500 })) {
              const tagClass = await el.evaluate((e) => `${e.tagName}.${e.className}`);
              console.log(`[getSkillInputElement] ✓ 入力欄発見: ${selector}[${i}] → ${tagClass}`);
              return el;
            }
          }
        }
      } catch {
        // 次のセレクタを試行
      }
    }

    console.log('[getSkillInputElement] ✗ スキル入力欄が見つかりません');
    return null;
  }

  /**
   * gb-field-select コンポーネントにスキル名を入力
   */
  private async inputSkillToFieldSelect(skillName: string): Promise<void> {
    if (!this.page) return;

    // 入力欄（input）が表示されているか確認
    const inputSelectors = [
      // gb-field-select 内の入力欄
      '.gb-field-select input',
      '.gb-field-select__input',
      // ドロップダウン内の検索入力
      '.gb-dropdown input',
      '.gb-dropdown__search',
      // 汎用的な入力欄
      'input[type="text"]:focus',
      'input:focus',
    ];

    for (const selector of inputSelectors) {
      try {
        const input = this.page.locator(selector).first();
        if (await input.isVisible({ timeout: 1000 })) {
          console.log(`[inputSkillToFieldSelect] 入力欄発見: ${selector}`);
          await input.fill(skillName);
          await this.page.waitForTimeout(ACTION_WAIT);
          console.log(`[inputSkillToFieldSelect] ✓ 入力完了: "${skillName}"`);
          return;
        }
      } catch {
        // 次のセレクタを試行
      }
    }

    // 入力欄が見つからない場合はキーボード入力を試行
    console.log('[inputSkillToFieldSelect] 入力欄が見つかりません。キーボード入力を試行...');
    await this.page.keyboard.type(skillName);
    await this.page.waitForTimeout(ACTION_WAIT);
    console.log(`[inputSkillToFieldSelect] ✓ キーボード入力完了: "${skillName}"`);
  }

  /**
   * ドロップダウンからスキルを選択
   */
  private async selectSkillFromDropdown(skillName: string): Promise<void> {
    if (!this.page) return;

    console.log(`[selectSkillFromDropdown] ドロップダウンから「${skillName}」を検索中...`);

    // 結果が表示されるまで少し待つ
    await this.page.waitForTimeout(1000);

    // デバッグ: ページ上に「しゃかりき」を含む要素があるか確認
    const matchingElements = await this.page.locator(`text=${skillName}`).count();
    console.log(`[selectSkillFromDropdown] ページ上の「${skillName}」を含む要素数: ${matchingElements}`);

    // デバッグ: ドロップダウンやリスト要素を確認
    const dropdownMenus = await this.page.locator('.dropdown-menu, [role="listbox"], ul.list-group').count();
    console.log(`[selectSkillFromDropdown] ドロップダウンメニュー数: ${dropdownMenus}`);

    // 複数のセレクタでドロップダウンオプションを探す
    const optionSelectors = [
      // Bootstrap select の option
      'select option',
      // vue-select 系
      '.vs__dropdown-option',
      SELECTORS.DROPDOWN_OPTION,
      // Bootstrap 系
      '.dropdown-item',
      '.list-group-item',
      // アクセシビリティ
      '[role="option"]',
      'li[role="option"]',
      // 汎用的なリストアイテム
      '.multiselect__option',
      'li.option',
    ];

    for (const selector of optionSelectors) {
      try {
        const option = this.page.locator(selector, { hasText: skillName }).first();
        if (await option.isVisible({ timeout: 1000 })) {
          console.log(`[selectSkillFromDropdown] ✓ 選択肢発見: ${selector}`);
          await option.click();
          await this.page.waitForTimeout(ACTION_WAIT);
          console.log(`[selectSkillFromDropdown] ✓ スキル「${skillName}」を選択しました`);
          return;
        }
      } catch {
        // 次のセレクタを試行
      }
    }

    // テキストを含む任意の要素をクリック（最終手段）
    console.log('[selectSkillFromDropdown] 標準セレクタで見つからず、テキスト検索を試行...');
    try {
      const fallbackOption = this.page.getByText(skillName, { exact: false }).first();
      if (await fallbackOption.isVisible({ timeout: 2000 })) {
        await fallbackOption.click();
        await this.page.waitForTimeout(ACTION_WAIT);
        console.log(`[selectSkillFromDropdown] ✓ スキル「${skillName}」を選択しました (fallback)`);
        return;
      }
    } catch {
      // 無視
    }

    console.log('[selectSkillFromDropdown] ✗ 選択肢が見つかりません');
    throw new Error(`スキル「${skillName}」の選択肢が見つかりません。--interactive オプションを使用して手動で選択することもできます。`);
  }

  /**
   * 検索を実行
   */
  private async executeSearch(): Promise<void> {
    if (!this.page) return;

    // 検索ボタンをクリック
    console.log('[executeSearch] 検索ボタンを探しています...');
    const searchButton = this.page.locator('button', { hasText: '検索' }).first();
    await searchButton.waitFor({ state: 'visible', timeout: 5000 });
    console.log('[executeSearch] 検索ボタンをクリック...');
    await searchButton.click();

    console.log('[executeSearch] 検索を実行中...');

    // 結果テーブルが表示されるまで待機
    try {
      await this.page.waitForSelector(SELECTORS.RESULT_TABLE, { timeout: DEFAULT_TIMEOUT });
      console.log('[executeSearch] ✓ 結果テーブルが表示されました');
    } catch (error) {
      console.log(`[executeSearch] ✗ 結果テーブルが見つかりません: ${error instanceof Error ? error.message : error}`);
      // デバッグ: ページの状態を確認
      const bodyText = await this.page.evaluate(() => document.body.innerText.substring(0, 500));
      console.log(`[executeSearch] ページ内容（500文字）: ${bodyText}...`);
    }

    // ローディング完了を待機（b-table-busy-slot が消えるまで）
    console.log('[executeSearch] ローディング完了を待機中...');
    try {
      await this.page.waitForSelector('.b-table-busy-slot', { state: 'hidden', timeout: DEFAULT_TIMEOUT });
      console.log('[executeSearch] ✓ ローディング完了');
    } catch {
      console.log('[executeSearch] ローディング待機タイムアウト（結果なしの可能性）');
    }

    // 追加の待機（結果のレンダリング完了）
    await this.page.waitForTimeout(1000);

    // デバッグ: 結果テーブルの行数を確認
    const tableRowCount = await this.page.locator(SELECTORS.RESULT_TABLE).locator('tbody tr').count();
    console.log(`[executeSearch] 結果テーブル行数: ${tableRowCount}`);
  }

  /**
   * ブラウザを終了する
   */
  async close(): Promise<void> {
    if (this.browser) {
      console.log('ブラウザを終了中...');
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
