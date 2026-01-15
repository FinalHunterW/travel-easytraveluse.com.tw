// js/app.js
import { UI } from './modules/ui.js';
import { Trips } from './modules/trips.js';
import { Events } from './modules/events.js';
import { Expenses } from './modules/expenses.js';
import { Places } from './modules/places.js';
import { Rates } from './modules/rates.js';
import { Weather } from './modules/weather.js';
import { Settings } from './modules/settings.js';

document.addEventListener('DOMContentLoaded', () => {
    
    Trips.init();

    const bottomNav = document.querySelector('.bottom-nav');
    const topBar = document.querySelector('.top-bar');
    const fab = document.getElementById('fab-add');
    const backBtn = document.getElementById('btn-back');

    let currentViewId = 'view-home';

    // --- 事件監聽 ---

    document.addEventListener('trip-selected', (e) => {
        enterTripMode(e.detail.id);
    });

    document.addEventListener('nav-request', (e) => {
        const targetId = e.detail.view;
        UI.switchView(targetId);
        topBar.style.display = 'flex';
        bottomNav.classList.remove('visible');
        if(targetId === 'view-tools') Rates.init().then(() => Weather.init());
        if(targetId === 'view-settings') Settings.init();
    });

    // ★★★ 關鍵新增：監聽「從景點加入行程」 ★★★
    document.addEventListener('request-add-event-from-place', (e) => {
        const { title, location } = e.detail;
        
        // 1. 切換到行程頁
        UI.switchView('view-events');
        currentViewId = 'view-events'; // 更新狀態
        
        // 2. 重新初始化 Events (確保是最新狀態)
        const tripId = Trips.currentTripId;
        Events.init(tripId);
        fab.style.display = 'flex';

        // 3. 打開 Modal
        UI.showModal(Events.getAddForm(), Events.saveFromForm);
        
        // 4. 自動填入資料 (延遲確保 DOM 渲染)
        setTimeout(() => {
            const inpTitle = document.getElementById('inp-title');
            const inpLoc = document.getElementById('inp-loc');
            if(inpTitle) inpTitle.value = title;
            if(inpLoc) inpLoc.value = location; // 如果有的話
        }, 100);
    });

    // 底部導航
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.dataset.target;
            const tripId = Trips.currentTripId;
            currentViewId = UI.switchView(targetId);

            if (targetId === 'view-events') { Events.init(tripId); fab.style.display = 'flex'; }
            if (targetId === 'view-expenses') { Expenses.init(tripId); fab.style.display = 'flex'; }
            if (targetId === 'view-places') { Places.init(tripId); fab.style.display = 'none'; }
            if (targetId === 'view-tools') { Rates.init().then(() => Weather.init()); fab.style.display = 'none'; }
        });
    });

    // 返回首頁
    backBtn.addEventListener('click', () => {
        UI.switchView('view-home');
        topBar.style.display = 'none';
        bottomNav.classList.remove('visible');
        fab.style.display = 'none';
        Trips.init();
    });

    // FAB
    fab.addEventListener('click', () => {
        if (currentViewId === 'view-events') UI.showModal(Events.getAddForm(), Events.saveFromForm);
        if (currentViewId === 'view-expenses') UI.showModal(Expenses.getAddForm(), Expenses.saveFromForm);
    });

    document.getElementById('btn-cancel').addEventListener('click', () => UI.hideModal());

    function enterTripMode(tripId) {
        currentViewId = UI.switchView('view-events');
        topBar.style.display = 'flex';
        bottomNav.classList.add('visible');
        fab.style.display = 'flex';
        Events.init(tripId);
    }
});
