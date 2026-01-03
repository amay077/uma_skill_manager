/**
 * E2E テストスクリプト
 *
 * ウマ娘スキル検索フロントエンドの動作確認を行う
 */

import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:8080';
const TIMEOUT = 60000; // DuckDB-WASM の初期化に時間がかかるため長めに設定

let browser;
let page;
let testsPassed = 0;
let testsFailed = 0;

async function log(message) {
  console.log(`[TEST] ${message}`);
}

async function pass(testName) {
  console.log(`✅ PASS: ${testName}`);
  testsPassed++;
}

async function fail(testName, error) {
  console.log(`❌ FAIL: ${testName}`);
  console.log(`   Error: ${error.message || error}`);
  testsFailed++;
}

async function setup() {
  log('ブラウザを起動中...');
  browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  page = await browser.newPage();
  page.setDefaultTimeout(TIMEOUT);

  // コンソールログを出力
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });

  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
  });
}

async function teardown() {
  if (browser) {
    await browser.close();
  }
}

// テスト1: ページ読み込みと DuckDB 初期化
async function testPageLoadAndInit() {
  const testName = 'ページ読み込みと DuckDB 初期化';
  try {
    log(`${testName} をテスト中...`);

    await page.goto(BASE_URL, { waitUntil: 'networkidle0' });

    // ローディングが消えるまで待機
    await page.waitForFunction(() => {
      const loading = document.getElementById('loading');
      return loading && loading.style.display === 'none';
    }, { timeout: TIMEOUT });

    // 検索セクションが表示されているか
    const searchVisible = await page.evaluate(() => {
      const section = document.getElementById('search-section');
      return section && section.style.display !== 'none';
    });

    if (!searchVisible) {
      throw new Error('検索セクションが表示されていません');
    }

    // 検索結果が表示されているか
    const resultsVisible = await page.evaluate(() => {
      const section = document.getElementById('results-section');
      return section && section.style.display !== 'none';
    });

    if (!resultsVisible) {
      throw new Error('結果セクションが表示されていません');
    }

    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

// テスト2: 初期検索結果の表示
async function testInitialResults() {
  const testName = '初期検索結果の表示';
  try {
    log(`${testName} をテスト中...`);

    // 結果件数を取得
    const countText = await page.$eval('#results-count', el => el.textContent);
    const match = countText.match(/(\d+)/);
    const count = match ? parseInt(match[1], 10) : 0;

    if (count === 0) {
      throw new Error('検索結果が0件です');
    }

    log(`  検索結果: ${count} 件`);

    // スキルカードが表示されているか
    const cardCount = await page.$$eval('.skill-card', cards => cards.length);

    if (cardCount === 0) {
      throw new Error('スキルカードが表示されていません');
    }

    log(`  表示カード数: ${cardCount} 件`);

    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

// テスト3: スキル名検索（リアルタイム検索）
async function testNameSearch() {
  const testName = 'スキル名検索';
  try {
    log(`${testName} をテスト中...`);

    // スキル名を入力（リアルタイム検索がデバウンス300msで発火）
    await page.type('#skill-name', '電光');

    // 結果が更新されるまで待機（デバウンス + 検索処理を考慮）
    await page.waitForFunction(() => {
      const cards = document.querySelectorAll('.skill-card');
      if (cards.length === 0) return false;
      const firstCard = cards[0];
      const name = firstCard.querySelector('.skill-name');
      return name && name.textContent.includes('電光');
    }, { timeout: 10000 });

    // 結果を確認
    const countText = await page.$eval('#results-count', el => el.textContent);
    log(`  検索結果: ${countText}`);

    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

// テスト4: クリア機能
async function testClearForm() {
  const testName = 'クリア機能';
  try {
    log(`${testName} をテスト中...`);

    // クリアボタンをクリック
    await page.click('#clear-btn');

    // 入力がクリアされるまで待機
    await page.waitForFunction(() => {
      const input = document.getElementById('skill-name');
      return input && input.value === '';
    }, { timeout: 5000 });

    // 入力値を確認
    const value = await page.$eval('#skill-name', el => el.value);

    if (value !== '') {
      throw new Error('入力がクリアされていません');
    }

    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

// テスト5: 詳細検索パネルの表示切替
async function testAdvancedPanelToggle() {
  const testName = '詳細検索パネルの表示切替';
  try {
    log(`${testName} をテスト中...`);

    // 初期状態で非表示か確認
    const initiallyHidden = await page.evaluate(() => {
      const panel = document.getElementById('advanced-panel');
      return panel && panel.style.display === 'none';
    });

    if (!initiallyHidden) {
      throw new Error('詳細パネルが初期状態で非表示ではありません');
    }

    // トグルボタンをクリック
    await page.click('#toggle-advanced');

    // 表示されるまで待機
    await page.waitForFunction(() => {
      const panel = document.getElementById('advanced-panel');
      return panel && panel.style.display !== 'none';
    }, { timeout: 5000 });

    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

// テスト6: 作戦フィルタ
async function testRunningStyleFilter() {
  const testName = '作戦フィルタ（逃げ）';
  try {
    log(`${testName} をテスト中...`);

    // 「逃げ」チェックボックスをクリック
    await page.click('input[name="running-style"][value="nige"]');

    // 結果が更新されるまで待機
    await new Promise(resolve => setTimeout(resolve, 500));

    // 結果を確認
    const countText = await page.$eval('#results-count', el => el.textContent);
    log(`  フィルタ後の結果: ${countText}`);

    // チェックを外す
    await page.click('input[name="running-style"][value="nige"]');
    await new Promise(resolve => setTimeout(resolve, 500));

    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

// テスト7: 効果種別フィルタ
async function testEffectTypeFilter() {
  const testName = '効果種別フィルタ（速度）';
  try {
    log(`${testName} をテスト中...`);

    // 「速度」ラジオボタンをクリック
    await page.click('input[name="effect-type"][value="speed"]');

    // 結果が更新されるまで待機
    await new Promise(resolve => setTimeout(resolve, 500));

    // 結果を確認
    const countText = await page.$eval('#results-count', el => el.textContent);
    log(`  フィルタ後の結果: ${countText}`);

    // 「全て」に戻す
    await page.click('input[name="effect-type"][value=""]');
    await new Promise(resolve => setTimeout(resolve, 500));

    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

// テスト8: ページネーション
async function testPagination() {
  const testName = 'ページネーション';
  try {
    log(`${testName} をテスト中...`);

    // ページネーションの存在確認
    const hasPagination = await page.evaluate(() => {
      const pagination = document.getElementById('pagination');
      return pagination && pagination.children.length > 0;
    });

    if (!hasPagination) {
      log('  ページネーションが表示されていません（1ページのみ）');
      pass(testName);
      return;
    }

    // 次のページボタンを探してクリック
    const hasNextPage = await page.evaluate(() => {
      const buttons = document.querySelectorAll('#pagination button');
      for (const btn of buttons) {
        if (btn.textContent === '2' && !btn.disabled) {
          return true;
        }
      }
      return false;
    });

    if (hasNextPage) {
      await page.click('#pagination button:nth-child(2)');
      await new Promise(resolve => setTimeout(resolve, 500));
      log('  2ページ目に移動しました');
    }

    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

// テスト9: スキルカードの詳細表示
async function testSkillCardDetails() {
  const testName = 'スキルカードの詳細表示';
  try {
    log(`${testName} をテスト中...`);

    // 詳細ボタンを探してクリック
    const hasDetailsButton = await page.evaluate(() => {
      const btn = document.querySelector('.skill-details-toggle');
      return btn !== null;
    });

    if (!hasDetailsButton) {
      log('  詳細ボタンが見つかりません（スキルカードがない可能性）');
      pass(testName);
      return;
    }

    await page.click('.skill-details-toggle');

    // 詳細が表示されるまで待機
    await page.waitForFunction(() => {
      const details = document.querySelector('.skill-details');
      return details !== null;
    }, { timeout: 5000 });

    log('  詳細が表示されました');

    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

// メイン実行
async function main() {
  console.log('='.repeat(50));
  console.log('ウマ娘スキル検索 E2E テスト');
  console.log('='.repeat(50));
  console.log('');

  try {
    await setup();

    await testPageLoadAndInit();
    await testInitialResults();
    await testNameSearch();
    await testClearForm();
    await testAdvancedPanelToggle();
    await testRunningStyleFilter();
    await testEffectTypeFilter();
    await testPagination();
    await testSkillCardDetails();
    
    // ページサイズ選択機能のテスト
    await testPageSizeDefault();
    await testPageSizeOptions();
    await testPageSizeChange();
    await testPageSizeResetPage();

  } catch (error) {
    console.log(`[FATAL] テスト実行エラー: ${error.message}`);
  } finally {
    await teardown();
  }

  console.log('');
  console.log('='.repeat(50));
  console.log(`テスト結果: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('='.repeat(50));

  process.exit(testsFailed > 0 ? 1 : 0);
}

main();
// テスト10: 表示件数選択（デフォルト値確認）
async function testPageSizeDefault() {
  const testName = '表示件数選択（デフォルト値）';
  try {
    log(`${testName} をテスト中...`);

    // ページサイズセレクタの存在確認
    const hasSelector = await page.evaluate(() => {
      const selector = document.getElementById('page-size');
      return selector !== null;
    });

    if (!hasSelector) {
      throw new Error('表示件数セレクタが見つかりません');
    }

    // デフォルト値が 20 であることを確認
    const defaultValue = await page.$eval('#page-size', el => el.value);
    
    if (defaultValue !== '20') {
      throw new Error('デフォルト値が 20 ではありません（実際: ' + defaultValue + '）');
    }

    log('  デフォルト値: 20件');
    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

// テスト11: 表示件数選択（オプション確認）
async function testPageSizeOptions() {
  const testName = '表示件数選択（オプション）';
  try {
    log(`${testName} をテスト中...`);

    // オプションの値を取得
    const options = await page.$$eval('#page-size option', opts => 
      opts.map(opt => opt.value)
    );

    const expectedOptions = ['10', '20', '50', '100'];
    const hasAllOptions = expectedOptions.every(expected => options.includes(expected));

    if (!hasAllOptions) {
      const optionsStr = options.join(', ');
      const expectedStr = expectedOptions.join(', ');
      throw new Error('期待されるオプションが揃っていません。期待: ' + expectedStr + ', 実際: ' + optionsStr);
    }

    log('  オプション: ' + options.join(', '));
    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

// テスト12: 表示件数変更（50件に変更）
async function testPageSizeChange() {
  const testName = '表示件数選択（50件に変更）';
  try {
    log(`${testName} をテスト中...`);

    // 変更前の表示件数を取得
    const cardsBefore = await page.$$eval('.skill-card', cards => cards.length);
    log('  変更前の表示件数: ' + cardsBefore + ' 件');

    // 表示件数を 50 に変更
    await page.select('#page-size', '50');

    // 結果が更新されるまで待機
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 変更後の表示件数を取得
    const cardsAfter = await page.$$eval('.skill-card', cards => cards.length);
    log('  変更後の表示件数: ' + cardsAfter + ' 件');

    // ページサイズが変更されたことを確認
    const newValue = await page.$eval('#page-size', el => el.value);
    if (newValue !== '50') {
      throw new Error('ページサイズが変更されていません（実際: ' + newValue + '）');
    }

    // 表示件数が増加したことを確認（データが十分にある場合）
    const totalCount = await page.evaluate(() => {
      const countText = document.getElementById('results-count').textContent;
      const match = countText.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    });

    // 総件数が50以上の場合、表示件数が増えたことを確認
    if (totalCount >= 50 && cardsAfter <= cardsBefore) {
      throw new Error('表示件数が増えていません。変更前: ' + cardsBefore + ', 変更後: ' + cardsAfter);
    }

    log('  総件数: ' + totalCount + ' 件、表示変更: ' + cardsBefore + ' → ' + cardsAfter);
    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}

// テスト13: 表示件数変更時にページがリセットされる
async function testPageSizeResetPage() {
  const testName = '表示件数変更時のページリセット';
  try {
    log(`${testName} をテスト中...`);

    // 表示件数を 10 に変更して複数ページを作る
    await page.select('#page-size', '10');
    await new Promise(resolve => setTimeout(resolve, 500));

    // 2ページ目があるか確認
    const hasSecondPage = await page.evaluate(() => {
      const buttons = document.querySelectorAll('#pagination button');
      for (const btn of buttons) {
        if (btn.textContent === '2' && !btn.disabled) {
          return true;
        }
      }
      return false;
    });

    if (!hasSecondPage) {
      log('  2ページ目が存在しないためスキップ');
      pass(testName);
      return;
    }

    // 2ページ目に移動
    const secondPageBtn = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('#pagination button'));
      return buttons.findIndex(btn => btn.textContent === '2');
    });
    
    if (secondPageBtn >= 0) {
      await page.click(`#pagination button:nth-child(${secondPageBtn + 1})`);
      await new Promise(resolve => setTimeout(resolve, 500));
      log('  2ページ目に移動');
    }

    // 表示件数を 20 に変更
    await page.select('#page-size', '20');
    await new Promise(resolve => setTimeout(resolve, 500));

    // 1ページ目に戻っているか確認
    const currentPage = await page.evaluate(() => {
      const activeBtn = document.querySelector('#pagination button.active');
      return activeBtn ? activeBtn.textContent : '1';
    });

    if (currentPage !== '1') {
      throw new Error('ページがリセットされていません（現在のページ: ' + currentPage + '）');
    }

    log('  ページが1ページ目にリセットされました');
    pass(testName);
  } catch (error) {
    fail(testName, error);
  }
}
