// js/modules/trips.js
import db from './db.js';
import { UI } from './ui.js';

export const Trips = {
    currentTripId: null,

    init: async () => {
        const container = document.getElementById('view-home');
        const trips = await db.trips.orderBy('startDate').reverse().toArray();

        container.innerHTML = `
            <div style="margin-bottom: 24px; padding-left: 4px;">
                <h1 style="font-size: 28px; color: var(--primary-color); margin-bottom: 4px;">TravelPlan</h1>
                <p style="color: var(--text-secondary); font-size: 15px;">開始規劃你的下一趟冒險</p>
            </div>

            <div class="dashboard-grid">
                <button class="action-btn" id="home-btn-add">
                    <div class="action-icon-box"><span class="material-symbols-rounded">add_circle</span></div>
                    <span class="action-label">新增旅行</span>
                </button>
                <button class="action-btn" id="home-btn-tools">
                    <div class="action-icon-box"><span class="material-symbols-rounded">calculate</span></div>
                    <span class="action-label">匯率工具</span>
                </button>
                <button class="action-btn" id="home-btn-settings">
                    <div class="action-icon-box"><span class="material-symbols-rounded">settings</span></div>
                    <span class="action-label">設定</span>
                </button>
                <button class="action-btn" onclick="alert('Version 2.0')">
                    <div class="action-icon-box"><span class="material-symbols-rounded">info</span></div>
                    <span class="action-label">關於</span>
                </button>
            </div>

            <div class="section-header">
                <span>我的旅行</span>
            </div>

            <div id="trips-list">
                ${trips.length === 0 ? `
                    <div class="empty-state">
                        <span class="material-symbols-rounded" style="font-size: 48px; color: #ddd;">flight_takeoff</span>
                        <p style="margin-top: 10px;">尚未建立旅行</p>
                    </div>
                ` : ''}
            </div>
        `;

        if (trips.length > 0) {
            const listEl = document.getElementById('trips-list');
            listEl.innerHTML = trips.map(t => {
                const cover = t.coverImage || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800';
                return `
                <div class="trip-card" data-id="${t.id}">
                    <img src="${cover}" class="trip-bg" loading="lazy">
                    <div class="trip-info">
                        <div class="trip-title">${t.title}</div>
                        <div class="trip-date">
                            <span class="material-symbols-rounded" style="font-size:16px">date_range</span>
                            ${t.startDate} ~ ${t.endDate}
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        }

        // 綁定事件
        const btnAdd = document.getElementById('home-btn-add');
        if(btnAdd) btnAdd.addEventListener('click', () => UI.showModal(Trips.getAddForm(), Trips.saveTrip));

        document.getElementById('home-btn-tools').addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('nav-request', { detail: { view: 'view-tools' } }));
        });
        document.getElementById('home-btn-settings').addEventListener('click', () => {
            document.dispatchEvent(new CustomEvent('nav-request', { detail: { view: 'view-settings' } }));
        });

        document.querySelectorAll('.trip-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const id = Number(e.currentTarget.dataset.id);
                Trips.selectTrip(id);
            });
        });
    },

    selectTrip: (id) => {
        Trips.currentTripId = id;
        localStorage.setItem('lastTripId', id);
        document.dispatchEvent(new CustomEvent('trip-selected', { detail: { id } }));
    },

    getAddForm: () => {
        return `
            <div class="form-group">
                <label class="form-label">旅行名稱</label>
                <input type="text" id="inp-trip-title" placeholder="例如: 日本賞櫻">
            </div>
            
            <div style="display:flex; gap:16px;">
                <div class="form-group" style="flex:1;">
                    <label class="form-label">開始日期</label>
                    <input type="date" id="inp-trip-start">
                </div>
                <div class="form-group" style="flex:1;">
                    <label class="form-label">結束日期</label>
                    <input type="date" id="inp-trip-end">
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">封面圖片 (選填)</label>
                <input type="text" id="inp-trip-cover" placeholder="圖片網址 https://...">
            </div>
        `;
    },

    saveTrip: async () => {
        const title = document.getElementById('inp-trip-title').value;
        const start = document.getElementById('inp-trip-start').value;
        const end = document.getElementById('inp-trip-end').value;
        const cover = document.getElementById('inp-trip-cover').value;

        if (!title || !start || !end) {
            alert('請填寫完整資訊');
            throw new Error('Validation failed');
        }

        await db.trips.add({ title, startDate: start, endDate: end, coverImage: cover });
        Trips.init();
    }
};