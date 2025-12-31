/**
 * セレクタデバッグ用スクリプト
 * サイトの DOM 構造を調査する
 *
 * 使用方法:
 * npx tsx src/debug-selectors.ts
 *
 * 広告が表示されたら手動で閉じてください。
 */

import { chromium } from 'playwright';
import * as readline from 'readline';

const UMA_DB_URL = 'https://uma.pure-db.com/#/search';

function waitForEnter(message: string): Promise<void> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(message, () => {
      rl.close();
      resolve();
    });
  });
}

async function debugSelectors() {
  console.log('ブラウザを起動中...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: 'ja-JP',
  });
  const page = await context.newPage();

  console.log(`${UMA_DB_URL} に遷移中...`);
  await page.goto(UMA_DB_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // ユーザーに広告を閉じてもらう
  await waitForEnter('\n広告が表示されている場合は手動で閉じてください。\n完了したら Enter を押してください...');

  console.log('\n=== DOM 構造の調査 ===\n');

  // 白因子（共通スキル）セクションの詳細を調査
  const whiteSkillSection = await page.evaluate(() => {
    // 「白因子（共通スキル）」ラベルを探す
    const labels = document.querySelectorAll('label');
    const label = Array.from(labels).find(
      (l) => l.textContent?.includes('白因子（共通スキル）')
    );
    if (!label) return { error: 'label not found' };

    // 親の form-group を取得
    const formGroup = label.closest('.form-group');
    if (!formGroup) return { error: 'form-group not found', labelFound: true };

    // form-group 内の HTML を取得
    return {
      labelText: label.textContent,
      formGroupHTML: formGroup.innerHTML,
    };
  });
  console.log('白因子（共通スキル）セクション:');
  console.log(JSON.stringify(whiteSkillSection, null, 2));

  // 「＋」ボタンや追加ボタンを探す
  const addButtons = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    return Array.from(buttons)
      .filter((b) => {
        const text = b.textContent || '';
        return text.includes('+') || text.includes('追加') || text.includes('＋');
      })
      .map((b) => ({
        text: b.textContent?.trim(),
        class: b.className,
        outerHTML: b.outerHTML.slice(0, 200),
      }));
  });
  console.log('\n追加ボタン:', JSON.stringify(addButtons, null, 2));

  // badge-pill 要素を探す（スキル選択用のチップ？）
  const badgePills = await page.evaluate(() => {
    const badges = document.querySelectorAll('.badge-pill, [class*="badge"]');
    return Array.from(badges)
      .slice(0, 20)
      .map((b) => ({
        text: (b.textContent || '').slice(0, 30),
        class: (b as HTMLElement).className,
        tag: b.tagName,
      }));
  });
  console.log('\nbadge要素:', JSON.stringify(badgePills, null, 2));

  // スキル名で検索できそうなモーダルやドロップダウンを探す
  const modals = await page.evaluate(() => {
    const modalElements = document.querySelectorAll('.modal, [role="dialog"], .dropdown-menu');
    return Array.from(modalElements).map((m) => ({
      class: (m as HTMLElement).className,
      visible: (m as HTMLElement).offsetParent !== null,
    }));
  });
  console.log('\nモーダル/ドロップダウン:', JSON.stringify(modals, null, 2));

  // 白因子セクション内のすべての要素をリスト
  const allElementsInSection = await page.evaluate(() => {
    const labels = document.querySelectorAll('label');
    const label = Array.from(labels).find(
      (l) => l.textContent?.includes('白因子（共通スキル）')
    );
    if (!label) return [];

    const formGroup = label.closest('.form-group');
    if (!formGroup) return [];

    const elements: string[] = [];
    const walk = (node: Element, depth: number) => {
      const el = node as HTMLElement;
      const indent = '  '.repeat(depth);
      let classStr = '';
      if (el.classList) {
        classStr = Array.from(el.classList).join('.');
      }
      elements.push(`${indent}${el.tagName}${classStr ? '.' + classStr : ''} id="${el.id || ''}" text="${(el.textContent || '').slice(0, 20).trim()}"`);
      Array.from(node.children).forEach((child) => walk(child, depth + 1));
    };
    walk(formGroup, 0);
    return elements;
  });
  console.log('\n白因子セクション内の全要素:');
  allElementsInSection.forEach((el) => console.log(el));

  // スクリーンショットを保存
  await page.screenshot({ path: 'scraping/debug-screenshot.png', fullPage: true });
  console.log('\nスクリーンショットを保存しました: scraping/debug-screenshot.png');

  await waitForEnter('\n調査完了。Enter を押すとブラウザを閉じます...');
  await browser.close();
  console.log('完了');
}

debugSelectors().catch(console.error);
