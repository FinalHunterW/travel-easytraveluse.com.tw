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
            <div class="card" style="padding: 24px; text-align: center; border: 1px solid #f0f0f0; box-shadow: none;">
                <span class="material-symbols-rounded" style="font-size: 32px; color: var(--primary-color); margin-bottom: 8px;">add_location_alt</span>
                <h3 style="margin: 0 0 16px 0; font-size: 16px;">收藏新景點</h3>
                <div style="display:flex; gap:12px;">
                    <input type="text" id="inp-place-name" placeholder="輸入景點名稱 (如: 清水寺)" style="flex:1; margin:0;">
                    <button id="btn-add-place" class="filled-btn" style="flex:none; width:auto; padding:0 24px;">新增</button>
                </div>
            </div>
            
            <div id="places-list" class="list-container" style="margin-top: 24px;">
                ${places.length === 0 ? '<div class="empty-state">尚未收藏任何景點</div>' : ''}
            </div>
        `;

        if (places.length > 0) {
            const listEl = document.getElementById('places-list');
            listEl.innerHTML = places.map(p => {
                const imgUrl = p.image || 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80';
                return `
                <div class="place-card">
                    <img src="${imgUrl}" class="place-img" loading="lazy">
                    
                    <button class="btn-place-delete" data-id="${p.id}">
                        <span class="material-symbols-rounded">close</span>
                    </button>

                    <div class="place-overlay">
                        <div class="place-title">${p.name}</div>
                        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}" target="_blank" class="btn-place-nav">
                            <span class="material-symbols-rounded" style="font-size:18px;">near_me</span>
                            導航
                        </a>
                    </div>
                </div>
                `;
            }).join('');
        }

        const addBtn = document.getElementById('btn-add-place');
        if(addBtn) {
            addBtn.addEventListener('click', async () => {
                const name = document.getElementById('inp-place-name').value.trim();
                if(!name) return;
                
                const originalText = addBtn.innerText;
                addBtn.innerText = '搜尋中...';
                addBtn.disabled = true;
                
                let imageUrl = await Places.fetchWikiImage(name);
                
                await db.places.add({ tripId: tripId, name: name, image: imageUrl });
                Places.init(tripId);
            });
        }
        
        container.querySelectorAll('.btn-place-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = Number(e.currentTarget.dataset.id);
                if(confirm('移除這個景點？')) {
                    await db.places.delete(id);
                    Places.init(tripId);
                }
            });
        });
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