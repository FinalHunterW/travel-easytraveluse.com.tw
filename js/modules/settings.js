// js/modules/settings.js
import db from './db.js';
import { Events } from './events.js'; // 匯入後用於還原後刷新
import { Expenses } from './expenses.js';

export const Settings = {
    init: () => {
        const container = document.getElementById('view-settings');
        
        // 渲染設定頁面 HTML
        container.innerHTML = `
            <div class="card">
                <h3>資料管理</h3>
                <p style="color:#666; font-size:0.9rem; margin-bottom:16px;">
                    為了防止資料遺失，請定期手動備份您的行程與記帳資料。
                </p>
                
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <button id="btn-backup" class="filled-btn" style="width:100%; display:flex; justify-content:center; align-items:center; gap:8px;">
                        <span class="material-symbols-outlined">download</span>
                        下載備份 (JSON)
                    </button>
                    
                    <button id="btn-restore-trigger" class="text-btn" style="width:100%; border:1px solid var(--outline); border-radius:20px; display:flex; justify-content:center; align-items:center; gap:8px;">
                        <span class="material-symbols-outlined">upload</span>
                        還原備份
                    </button>
                    
                    <input type="file" id="inp-restore-file" accept=".json" style="display:none;">

                    <hr style="width:100%; border:0; border-top:1px solid #eee; margin:8px 0;">

                    <button id="btn-clear-all" style="color:red; background:none; border:none; padding:12px; cursor:pointer;">
                        清除所有資料 (重置)
                    </button>
                </div>
            </div>
            
            <div style="text-align:center; color:#999; font-size:0.8rem; margin-top:20px;">
                旅遊小工具 v1.0<br>大家一起開心出遊!
            </div>
        `;

        // 綁定事件
        Settings.bindEvents();
    },

    bindEvents: () => {
        // 1. 備份 (Export)
        document.getElementById('btn-backup').addEventListener('click', async () => {
            try {
                // 從資料庫抓取所有資料
                const events = await db.events.toArray();
                const expenses = await db.expenses.toArray();
                const settings = await db.settings.toArray();

                const data = {
                    timestamp: new Date().toISOString(),
                    events,
                    expenses,
                    settings
                };

                // 轉成 JSON Blob
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                // 建立暫時的下載連結
                const a = document.createElement('a');
                a.href = url;
                a.download = `travel_backup_${new Date().toISOString().slice(0,10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url); // 釋放記憶體

            } catch (err) {
                console.error(err);
                alert('備份失敗：' + err.message);
            }
        });

        // 2. 還原觸發 (Trigger Input)
        document.getElementById('btn-restore-trigger').addEventListener('click', () => {
            document.getElementById('inp-restore-file').click();
        });

        // 3. 實際還原邏輯 (File Read)
        document.getElementById('inp-restore-file').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!confirm('警告：還原將會「覆蓋」目前的資料，確定要繼續嗎？')) {
                e.target.value = ''; // 清空選擇
                return;
            }

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    // 檢查格式是否正確
                    if (!data.events || !data.expenses) {
                        throw new Error('無效的備份檔案格式');
                    }

                    // 使用 Transaction 確保原子性 (要嘛全成功，要嘛全失敗)
                    await db.transaction('rw', db.events, db.expenses, db.settings, async () => {
                        // 清空現有資料
                        await db.events.clear();
                        await db.expenses.clear();
                        await db.settings.clear();

                        // 寫入新資料
                        await db.events.bulkAdd(data.events);
                        await db.expenses.bulkAdd(data.expenses);
                        if (data.settings) await db.settings.bulkAdd(data.settings);
                    });

                    alert('還原成功！');
                    e.target.value = ''; // 重置 input
                    // 這裡可以選擇重新整理頁面，或是呼叫各模組 init
                    location.reload(); 

                } catch (err) {
                    alert('還原失敗：' + err.message);
                }
            };
            reader.readAsText(file);
        });

        // 4. 清除所有資料
        document.getElementById('btn-clear-all').addEventListener('click', async () => {
            if (confirm('危險操作：這將會刪除所有行程與記帳資料且無法復原！確定嗎？')) {
                await db.events.clear();
                await db.expenses.clear();
                alert('已重置所有資料。');
                location.reload();
            }
        });
    }
};