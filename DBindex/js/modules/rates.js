// js/modules/rates.js
import db from './db.js';

export const Rates = {
    init: async () => {
        const container = document.getElementById('tool-content');
        const settings = await db.settings.toArray();
        const savedRate = settings.find(s => s.key === 'defaultRate')?.value || 0.22;

        container.innerHTML = `
            <div class="card" style="padding: 24px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom: 24px;">
                    <span class="material-symbols-rounded" style="color:var(--primary-color);">currency_exchange</span>
                    <h3 style="margin:0;">匯率計算機</h3>
                </div>

                <div class="form-group">
                    <label class="form-label">JPY (日圓)</label>
                    <input type="number" id="calc-jpy" placeholder="0" style="font-size: 20px; font-weight: 600;">
                </div>

                <div style="text-align:center; margin: 12px 0;">
                    <span class="material-symbols-rounded" style="color:var(--text-secondary);">swap_vert</span>
                </div>

                <div class="form-group">
                    <label class="form-label">TWD (新台幣)</label>
                    <input type="number" id="calc-twd" placeholder="0" style="font-size: 20px; font-weight: 600;">
                </div>

                <div style="background:#F2F2F7; padding:16px; border-radius:12px; display:flex; align-items:center; gap:12px; margin-top: 24px;">
                    <span style="font-size:14px; color:var(--text-secondary);">匯率設定 (1 JPY =)</span>
                    <input type="number" id="calc-rate" value="${savedRate}" step="0.001" style="width:80px; padding:8px; margin:0; text-align:center;">
                    <span style="font-size:14px; font-weight:600;">TWD</span>
                </div>
            </div>
            <div id="weather-card-container"></div>
        `;

        const inpJPY = document.getElementById('calc-jpy');
        const inpTWD = document.getElementById('calc-twd');
        const inpRate = document.getElementById('calc-rate');

        inpRate.addEventListener('change', async (e) => {
            const newRate = parseFloat(e.target.value);
            if (newRate > 0) {
                await db.settings.put({ key: 'defaultRate', value: newRate });
                inpJPY.dispatchEvent(new Event('input'));
            }
        });

        inpJPY.addEventListener('input', () => {
            const jpy = parseFloat(inpJPY.value);
            const rate = parseFloat(inpRate.value);
            if (!isNaN(jpy)) inpTWD.value = Math.round(jpy * rate);
            else inpTWD.value = '';
        });

        inpTWD.addEventListener('input', () => {
            const twd = parseFloat(inpTWD.value);
            const rate = parseFloat(inpRate.value);
            if (!isNaN(twd) && rate > 0) inpJPY.value = Math.round(twd / rate);
            else inpJPY.value = '';
        });
    }
};