// js/modules/events.js
import db from './db.js';

export const Events = {
    currentTripId: null,
    currentFilterDate: null, // null 代表顯示全部，或是格式 "MM/DD"

    // 初始化：接收 tripId
    init: async (tripId) => {
        if (!tripId) return;
        Events.currentTripId = tripId;

        const container = document.getElementById('events-container');
        
        // 1. 取得旅行資訊 (為了算日期)
        const trip = await db.trips.get(tripId);
        if (!trip) {
            container.innerHTML = '<div class="empty-state">找不到旅行資料</div>';
            return;
        }

        // 2. 取得該旅行的所有行程
        const events = await db.events
            .where('tripId').equals(tripId)
            .sortBy('startTime');

        // 3. 產生日期列表 (Start ~ End)
        const dates = Events.generateDateRange(trip.startDate, trip.endDate);
        
        // 如果還沒選日期，預設選第一天
        if (!Events.currentFilterDate && dates.length > 0) {
            Events.currentFilterDate = dates[0].display; // "MM/DD"
        }

        // 4. 渲染上方日期選擇器
        const selectorHtml = `
            <div class="day-selector-container">
                <div class="day-scroll-wrapper">
                    <div class="day-chip ${Events.currentFilterDate === 'ALL' ? 'active' : ''}" onclick="window.filterEvents('ALL')">
                        <span class="day-num">ALL</span>
                        <span class="day-date">全部</span>
                    </div>
                    ${dates.map((d, i) => `
                        <div class="day-chip ${Events.currentFilterDate === d.display ? 'active' : ''}" onclick="window.filterEvents('${d.display}', '${d.full}')">
                            <span class="day-num">DAY ${i + 1}</span>
                            <span class="day-date">${d.display}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // 5. 篩選並渲染行程列表
        // 這裡做個簡單的日期比對：假設 startTime 是 "2025-12-19T10:00"
        const filteredEvents = events.filter(e => {
            if (Events.currentFilterDate === 'ALL') return true;
            if (!e.startTime) return false;
            // 比對 "MM/DD"
            const dateObj = new Date(e.startTime);
            const mon = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            const day = dateObj.getDate().toString().padStart(2, '0');
            return `${mon}/${day}` === Events.currentFilterDate;
        });

        const listHtml = `
            <div class="timeline-container">
                ${filteredEvents.length === 0 
                    ? '<div class="empty-state" style="padding-left:0;">這天沒有行程，點擊 + 新增</div>' 
                    : filteredEvents.map(evt => Events.renderCard(evt)).join('')}
            </div>
        `;

        container.innerHTML = selectorHtml + listHtml;

        // 6. 綁定全域篩選函式 (為了讓 HTML onclick 能呼叫)
        window.filterEvents = (displayDate) => {
            Events.currentFilterDate = displayDate;
            Events.init(tripId); // 重新渲染
        };
        
        // 綁定刪除按鈕
        container.querySelectorAll('.btn-del-event').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = Number(e.currentTarget.dataset.id);
                if (confirm('確定刪除？')) {
                    await db.events.delete(id);
                    Events.init(tripId);
                }
            });
        });
    },

    // 輔助：渲染不同類型的卡片
    renderCard: (evt) => {
        const time = evt.startTime ? evt.startTime.split('T')[1] : '--:--';
        
        // --- A. 航班卡片 ---
        if (evt.subType === 'flight') {
            return `
            <div class="event-card flight-card">
                <div class="event-time">${time} 起飛</div>
                <div style="opacity:0.9; font-size:14px;">航班資訊</div>
                <div class="flight-row">
                    <div class="flight-code">${evt.title}</div> <span class="material-symbols-rounded flight-icon">flight</span>
                    <div class="flight-code">${evt.location}</div> </div>
                <button class="btn-del-event" data-id="${evt.id}" style="color:white;"><span class="material-symbols-rounded">close</span></button>
            </div>`;
        }
        
        // --- B. 住宿卡片 ---
        if (evt.subType === 'hotel') {
            return `
            <div class="event-card hotel-card">
                <div class="event-time">Check-in: ${time}</div>
                <div class="event-title">🏨 ${evt.title}</div>
                <div class="event-meta">
                    <span class="material-symbols-rounded" style="font-size:16px;">location_on</span>
                    ${evt.location}
                </div>
                <button class="btn-del-event" data-id="${evt.id}"><span class="material-symbols-rounded">close</span></button>
            </div>`;
        }

        // --- C. 一般行程 ---
        return `
            <div class="event-card">
                <div class="event-time">${time}</div>
                <div class="event-title">${evt.title}</div>
                <div class="event-meta">
                    <span class="material-symbols-rounded" style="font-size:16px;">location_on</span>
                    ${evt.location || '無地點'}
                </div>
                <button class="btn-del-event" data-id="${evt.id}"><span class="material-symbols-rounded">close</span></button>
            </div>`;
    },

    // 輔助：產生日期區間陣列
    generateDateRange: (start, end) => {
        const arr = [];
        let dt = new Date(start);
        const endDt = new Date(end);
        
        while (dt <= endDt) {
            const mon = (dt.getMonth() + 1).toString().padStart(2, '0');
            const day = dt.getDate().toString().padStart(2, '0');
            const full = dt.toISOString().split('T')[0];
            arr.push({ display: `${mon}/${day}`, full: full });
            dt.setDate(dt.getDate() + 1);
        }
        return arr;
    },


    getAddForm: () => {
        return `
            <div class="form-group">
                <label class="form-label">類型</label>
                <select id="inp-sub-type">
                    <option value="activity">一般行程</option>
                    <option value="flight">航班 (標題填起飛地)</option>
                    <option value="hotel">住宿</option>
                    <option value="food">餐廳/美食</option>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">標題</label>
                <input type="text" id="inp-title" placeholder="例如: 參觀博物館">
            </div>
            
            <div class="form-group">
                <label class="form-label">時間</label>
                <input type="datetime-local" id="inp-time">
            </div>
            
            <div class="form-group">
                <label class="form-label">地點 / 備註</label>
                <input type="text" id="inp-loc" placeholder="輸入地址或備註">
            </div>
        `;
    },

    saveFromForm: async () => {
        const tripId = Events.currentTripId;
        const subType = document.getElementById('inp-sub-type').value;
        const title = document.getElementById('inp-title').value;
        const time = document.getElementById('inp-time').value;
        const loc = document.getElementById('inp-loc').value;

        if (!title || !time) { alert('請填寫完整'); return; }

        await db.events.add({
            tripId: tripId, // 關聯 key
            title: title,
            startTime: time,
            location: loc,
            type: 'activity',
            subType: subType // 存入類型
        });

        Events.init(tripId);
    }
};