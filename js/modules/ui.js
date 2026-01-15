// js/modules/ui.js
export const UI = {
    // 切換分頁
    switchView: (targetId) => {
        // 1. 隱藏所有 View
        document.querySelectorAll('.view').forEach(el => {
            el.style.display = 'none';
        });
        
        // 2. 移除所有 Nav Active 狀態
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
        });

        // 3. 顯示目標 View
        const targetView = document.getElementById(targetId);
        if (targetView) {
            targetView.style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // 4. 設定 Nav Active
        const navBtn = document.querySelector(`.nav-item[data-target="${targetId}"]`);
        if (navBtn) navBtn.classList.add('active');

        // 5. 更新頂部標題 (非首頁才顯示標題)
        const titles = {
            'view-events': '行程規劃',
            'view-places': '景點地圖',
            'view-expenses': '記帳管理',
            'view-tools': '實用工具',
            'view-settings': '設定'
        };
        const titleEl = document.getElementById('app-title');
        if (titleEl) titleEl.textContent = titles[targetId] || '旅程規劃';
        
        return targetId;
    },

    // 顯示 Modal (修正：配合 CSS .visible 動畫)
    showModal: (contentHtml, saveCallback) => {
        const modal = document.getElementById('modal-overlay');
        const body = document.getElementById('modal-body');
        const saveBtn = document.getElementById('btn-save');
        
        // 插入內容
        body.innerHTML = contentHtml;
        
        // ★★★ 修正點：使用 visible 類別來觸發 CSS opacity 動畫 ★★★
        modal.classList.remove('hidden'); // 防呆，移除舊類別
        modal.classList.add('visible');   // 加入新類別

        // 深拷貝按鈕以清除舊的 Event Listeners
        const newBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newBtn, saveBtn);
        
        // 綁定新的儲存事件
        newBtn.addEventListener('click', async () => {
            const originalText = newBtn.innerText;
            newBtn.innerText = '處理中...';
            newBtn.disabled = true;
            
            try {
                await saveCallback();
                UI.hideModal();
            } catch (e) {
                console.error(e);
                // 不要在這裡 alert，讓 saveCallback 決定是否要擋下
                // alert('操作失敗'); 
            } finally {
                newBtn.innerText = originalText;
                newBtn.disabled = false;
            }
        });
    },

    // 隱藏 Modal
    hideModal: () => {
        const modal = document.getElementById('modal-overlay');
        // ★★★ 修正點：移除 visible 類別 ★★★
        modal.classList.remove('visible');
        
        // 等待 CSS transition (0.3s) 結束後再清空內容 (可選)
        setTimeout(() => {
            if(!modal.classList.contains('visible')) {
                // double check 防止快速開關導致的問題
            }
        }, 300);
    }
};