/**
 * ページネーションコンポーネント
 */

import { PAGINATION } from '../db/constants.js';

/**
 * ページネーションを描画
 * @param {object} options - オプション
 * @param {number} options.currentPage - 現在のページ（1始まり）
 * @param {number} options.totalItems - 総件数
 * @param {number} options.pageSize - 1ページあたりの件数
 * @param {function} options.onPageChange - ページ変更時のコールバック
 * @param {HTMLElement} container - 描画先のコンテナ
 */
export function renderPagination({ currentPage, totalItems, pageSize, onPageChange }, container) {
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  const pages = generatePageNumbers(currentPage, totalPages);

  let html = `
    <button ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
      &lt; 前へ
    </button>
  `;

  for (const page of pages) {
    if (page === '...') {
      html += `<span class="pagination-info">...</span>`;
    } else {
      html += `
        <button
          class="${page === currentPage ? 'active' : ''}"
          data-page="${page}"
          ${page === currentPage ? 'disabled' : ''}
        >
          ${page}
        </button>
      `;
    }
  }

  html += `
    <button ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
      次へ &gt;
    </button>
  `;

  container.innerHTML = html;

  // イベントリスナー設定
  container.querySelectorAll('button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        onPageChange(page);
      }
    });
  });
}

/**
 * 表示するページ番号を生成
 * @param {number} current - 現在のページ
 * @param {number} total - 総ページ数
 * @returns {Array} ページ番号の配列（省略部分は '...'）
 */
function generatePageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [];

  // 先頭
  pages.push(1);

  // 省略または2ページ目
  if (current > 4) {
    pages.push('...');
  } else if (current > 3) {
    pages.push(2);
  }

  // 現在ページ周辺
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) {
      pages.push(i);
    }
  }

  // 省略または最後から2ページ目
  if (current < total - 3) {
    pages.push('...');
  } else if (current < total - 2) {
    pages.push(total - 1);
  }

  // 末尾
  if (!pages.includes(total)) {
    pages.push(total);
  }

  return pages;
}

/**
 * 結果件数の表示を更新
 * @param {number} total - 総件数
 * @param {number} currentPage - 現在のページ
 * @param {number} pageSize - 1ページあたりの件数
 */
export function updateResultsCount(total, currentPage, pageSize) {
  const countEl = document.getElementById('results-count');
  if (total === 0) {
    countEl.textContent = '検索結果: 0件';
  } else {
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, total);
    countEl.textContent = `検索結果: ${total}件（${start}〜${end}件表示）`;
  }
}
