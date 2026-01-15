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

        // 渲染卡片
        if (places.length > 0) {
            const listEl = document.getElementById('places-list');
            listEl.innerHTML = places.map(p => {
                // 如果沒有圖片，使用預設圖
                const imgUrl = p.image || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=400';
                
                return `
                <div class="place-card">
                    <div class="place-img-box">
                        <img src="${imgUrl}" class="place-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=400'">
                    </div>
                    
                    <div class="place-info">
                        <div class="place-title">${p.name}</div>
                        
                        <div class="place-actions">
                            <button class="action-chip add-event" data-name="${p.name}">
                                <span class="material-symbols-rounded" style="font-size:16px;">event_available</span>
                                加入行程
                            </button>
                            
                            <a href="${p.googleLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}`}" target="_blank" class="action-chip">
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

        document.getElementById('btn-smart-add').addEventListener('click', () => {
            Places.handleSmartAdd(tripId);
        });

        document.querySelectorAll('.add-event').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const name = e.currentTarget.dataset.name;
                document.dispatchEvent(new CustomEvent('request-add-event-from-place', { 
                    detail: { title: name, location: name } 
                }));
            });
        });
        
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

    // ★★★ 修正後的智慧新增邏輯 ★★★
    handleSmartAdd: async (tripId) => {
        const inp = document.getElementById('inp-google-link');
        const btn = document.getElementById('btn-smart-add');
        const val = inp.value.trim();
        if(!val) return;

        const originalText = btn.innerText;
        btn.innerText = '處理中...';
        btn.disabled = true;

        let name = val;
        let googleLink = ''; // 預設為空，若輸入的是網址則填入

        // 1. 判斷是否為網址
        const isUrl = val.includes('http') || val.includes('goo.gl') || val.includes('maps.app');

        if (isUrl) {
            googleLink = val; // 存下連結以便導航
            
            // 嘗試從長網址解析名稱 (例如 /place/地點名稱/...)
            let extractedName = null;
            
            if (val.includes('/place/')) {
                try {
                    const parts = val.split('/place/');
                    if (parts[1]) {
                        // 取出名稱並解碼
                        extractedName = decodeURIComponent(parts[1].split('/')[0].replace(/\+/g, ' '));
                    }
                } catch(e) {}
            } else if (val.includes('?q=')) {
                try {
                    const urlObj = new URL(val);
                    extractedName = urlObj.searchParams.get('q');
                } catch(e) {}
            }

            // 如果解析失敗 (短網址) 或者解析出來還是亂碼，就詢問使用者
            if (!extractedName) {
                // 這裡使用 prompt 作為快速解決方案，使用者體驗較好
                const userInput = prompt('這是一個短網址，無法自動取得名稱。\n請輸入景點名稱以便搜尋圖片：', '');
                if (userInput) {
                    name = userInput;
                } else {
                    // 使用者取消，恢復按鈕狀態
                    btn.innerText = originalText;
                    btn.disabled = false;
                    return;
                }
            } else {
                name = extractedName;
            }
        }

        // 2. 去維基百科抓圖
        let imageUrl = await Places.fetchWikiImage(name);
        
        // 3. 存入資料庫
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
            // 嘗試搜尋
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
