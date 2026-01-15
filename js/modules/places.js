// js/modules/places.js
import db from './db.js';
import { UI } from './ui.js';

export const Places = {
    currentTripId: null,

    init: async (tripId) => {
        if (!tripId) return;
        Places.currentTripId = tripId;

        const container = document.getElementById('view-places');
        const places = await db.places.where('tripId').equals(tripId).toArray();

        container.innerHTML = `
            <div class="link-input-area">
                <span class="material-symbols-rounded" style="color:var(--primary-color); font-size: 24px;">link</span>
                <div style="flex:1;">
                    <input type="text" id="inp-google-link" placeholder="貼上 Google Maps 連結或輸入名稱" style="width:100%; margin-bottom:8px; background:#fff;">
                    <div style="display:flex; justify-content:flex-end;">
                        <button id="btn-smart-add" class="filled-btn" style="width:auto; padding:8px 20px; font-size:14px; border-radius:20px;">智慧新增</button>
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom:16px; font-size:15px; font-weight:700; color:#333; margin-left:4px;">
                已收藏地點 (${places.length})
            </div>

            <div id="places-list" class="list-container">
                ${places.length === 0 ? '<div class="empty-state">尚未收藏任何景點</div>' : ''}
            </div>
        `;

        // 渲染新版卡片
        if (places.length > 0) {
            const listEl = document.getElementById('places-list');
            listEl.innerHTML = places.map(p => {
                const imgUrl = p.image || 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                
                return `
                <div class="place-card">
                    <div class="place-img-box">
                        <img src="${imgUrl}" class="place-img" loading="lazy">
                    </div>
                    
                    <div class="place-info">
                        <div class="place-title">${p.name}</div>
                        
                        <div class="place-actions">
                            <button class="action-chip add-event" data-name="${p.name}">
                                <span class="material-symbols-rounded" style="font-size:16px;">event_available</span>
                                加入行程
                            </button>
                            
                            <a href="${p.googleLink || `http://googleusercontent.com/maps.google.com/9{encodeURIComponent(p.name)}`}" target="_blank" class="action-chip">
                                <span class="material-symbols-rounded" style="font-size:16px;">near_me</span>
                                導航
                            </a>
                        </div>
                    </div>

                    <button class="btn-place-delete" data-id="${p.id}">
                        <span class="material-symbols-rounded" style="font-size:18px;">close</span>
                    </button>
                </div>
                `;
            }).join('');
        }

        // --- 綁定事件 ---

        // 1. 智慧新增按鈕
        document.getElementById('btn-smart-add').addEventListener('click', () => {
            Places.handleSmartAdd(tripId);
        });

        // 2. 加入行程按鈕
        document.querySelectorAll('.add-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const name = e.currentTarget.dataset.name;
                // 發送事件給 App，要求打開新增行程 Modal 並填入資料
                document.dispatchEvent(new CustomEvent('request-add-event-from-place', { 
                    detail: { title: name, location: name } 
                }));
            });
        });
        
        // 3. 刪除按鈕
        document.querySelectorAll('.btn-place-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = Number(e.currentTarget.dataset.id);
                if(confirm('移除這個收藏？')) {
                    await db.places.delete(id);
                    Places.init(tripId);
                }
            });
        });
    },

    // 處理智慧新增邏輯
    handleSmartAdd: async (tripId) => {
        const inp = document.getElementById('inp-google-link');
        const btn = document.getElementById('btn-smart-add');
        const val = inp.value.trim();
        if(!val) return;

        const originalText = btn.innerText;
        btn.innerText = '處理中...';
        btn.disabled = true;

        let name = val;
        let googleLink = '';

        // 簡單解析 Google Maps URL (這部分可以根據需求擴充)
        if (val.includes('maps.google') || val.includes('goo.gl')) {
            googleLink = val;
            // 嘗試從網址或提示中獲取名稱 (簡化版)
            if (val.includes('/place/')) {
                 try {
                    const parts = val.split('/place/');
                    if (parts[1]) {
                        name = decodeURIComponent(parts[1].split('/')[0].replace(/\+/g, ' '));
                    }
                 } catch(e) {}
            } else {
                 // 如果是短網址，名稱先暫定，讓使用者後續修改或搜尋
                 // 實務上這裡可能需要後端爬蟲，純前端只能做到這樣
            }
        }

        // 抓圖並存檔
        let imageUrl = await Places.fetchWikiImage(name);
        
        await db.places.add({ 
            tripId: tripId, 
            name: name, 
            image: imageUrl,
            googleLink: googleLink 
        });

        inp.value = '';
        btn.innerText = originalText;
        btn.disabled = false;
        Places.init(tripId);
    },

    fetchWikiImage: async (keyword) => {
        try {
            const url = `https://zh.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages&piprop=thumbnail&pithumbsize=600&origin=*&titles=${encodeURIComponent(keyword)}`;
            const res = await fetch(url);
            const data = await res.json();
            const pages = data.query.pages;
            const pageId = Object.keys(pages)[0];
            if (pageId === '-1') return null;
            const page = pages[pageId];
            return (page.thumbnail && page.thumbnail.source) ? page.thumbnail.source : null;
        } catch (e) { return null; }
    }
};
