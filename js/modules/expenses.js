// js/modules/expenses.js
import db from './db.js';

export const Expenses = {
    currentTripId: null,

    init: async (tripId) => {
        if (!tripId) return;
        Expenses.currentTripId = tripId;

        const container = document.getElementById('expenses-container');
        const totalEl = document.getElementById('total-expense');
        
        // 修正：只讀取該 tripId 的資料
        const expenses = await db.expenses
            .where('tripId').equals(tripId)
            .reverse() // Dexie sort limitation: where+sort 比較複雜，這裡先簡單用 filter
            .toArray();
            
        // 因為 IndexedDB 簡單查詢不能直接 sort desc，我們手動排
        expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        const total = expenses.reduce((sum, item) => sum + (Number(item.amountTWD) || 0), 0);
        if (totalEl) totalEl.textContent = Math.round(total).toLocaleString();

        if (expenses.length === 0) {
            container.innerHTML = '<div class="empty-state">尚無支出記錄</div>';
            return;
        }

        container.innerHTML = expenses.map(item => `
            <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding-right:40px; position:relative;">
                <div>
                    <div style="font-weight:600; font-size:1.1rem;">${item.category}</div>
                    <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:2px;">${item.date}</div>
                    ${item.note ? `<div style="font-size:0.85rem; color:var(--text-secondary); margin-top:2px;">${item.note}</div>` : ''}
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:700; color:var(--primary-color);">
                        $${Math.round(item.amountTWD).toLocaleString()}
                    </div>
                    <div style="font-size:0.8rem; color:var(--text-secondary);">
                        ¥${Number(item.originalAmount).toLocaleString()}
                    </div>
                </div>
                <button class="btn-delete-expense" data-id="${item.id}" style="position:absolute; top:50%; right:8px; transform:translateY(-50%); border:none; background:none; color:#FF3B30; padding:8px;">
                    <span class="material-symbols-rounded">delete</span>
                </button>
            </div>
        `).join('');

        container.querySelectorAll('.btn-delete-expense').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = Number(e.currentTarget.dataset.id);
                if (confirm('刪除此筆支出？')) {
                    await db.expenses.delete(id);
                    Expenses.init(tripId);
                }
            });
        });
    },


    getAddForm: () => {
        const today = new Date().toISOString().split('T')[0];
        return `
            <div style="display:flex; gap:16px;">
                <div class="form-group" style="flex:2;">
                    <label class="form-label">金額 (原幣)</label>
                    <input type="number" id="inp-amount" placeholder="0" style="font-size:1.2rem;">
                </div>
                <div class="form-group" style="flex:1;">
                    <label class="form-label">匯率</label>
                    <input type="number" id="inp-rate" value="0.22" step="0.001">
                </div>
            </div>

            <div style="display:flex; gap:16px;">
                <div class="form-group" style="flex:1;">
                    <label class="form-label">類別</label>
                    <select id="inp-category">
                        <option value="餐飲">餐飲</option>
                        <option value="交通">交通</option>
                        <option value="購物">購物</option>
                        <option value="住宿">住宿</option>
                        <option value="門票">門票</option>
                        <option value="其他">其他</option>
                    </select>
                </div>
                <div class="form-group" style="flex:1;">
                    <label class="form-label">日期</label>
                    <input type="date" id="inp-date" value="${today}">
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">備註</label>
                <input type="text" id="inp-note" placeholder="詳細說明...">
            </div>

            <div style="text-align:center; color:var(--primary-color); font-weight:600; margin-top:8px;">
                約 <span id="preview-twd">0</span> TWD
            </div>
        `;
    },

    saveFromForm: async () => {
        const tripId = Expenses.currentTripId; // 取得當前 Trip ID
        const amount = parseFloat(document.getElementById('inp-amount').value);
        const rate = parseFloat(document.getElementById('inp-rate').value);
        const category = document.getElementById('inp-category').value;
        const date = document.getElementById('inp-date').value;
        const note = document.getElementById('inp-note').value;

        if (!amount) { alert('請輸入金額'); return; }

        await db.expenses.add({
            tripId: tripId, // 寫入關聯
            originalAmount: amount,
            exchangeRate: rate,
            amountTWD: amount * rate,
            currency: 'JPY',
            category, date, note
        });
        Expenses.init(tripId);
    }
};