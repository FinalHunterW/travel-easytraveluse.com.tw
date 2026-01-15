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
    
    // 初始化首頁
    Trips.init();

    const bottomNav = document.querySelector('.bottom-nav');
    const topBar = document.querySelector('.top-bar');
    const fab = document.getElementById('fab-add');
    const backBtn = document.getElementById('btn-back');

    let currentViewId = 'view-home';

    // --- 事件監聽 ---

    // 1. 進入旅行 (來自 Trips)
    document.addEventListener('trip-selected', (e) => {
        const tripId = e.detail.id;
        enterTripMode(tripId);
    });

    // 2. 來自首頁快捷鍵的跳轉 (例如: 直接點匯率工具)
    document.addEventListener('nav-request', (e) => {
        const targetId = e.detail.view;
        // 顯示返回鍵，隱藏底部導航 (因為這是全域工具)
        UI.switchView(targetId);
        topBar.style.display = 'flex';
        bottomNav.classList.remove('visible');
        
        // 載入全域工具
        if(targetId === 'view-tools') Rates.init().then(() => Weather.init());
        if(targetId === 'view-settings') Settings.init();
    });

    // 3. 底部導航切換 (在旅行內部)
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.dataset.target;
            const tripId = Trips.currentTripId;
            currentViewId = UI.switchView(targetId);

            // 根據分頁載入模組
            if (targetId === 'view-events') { Events.init(tripId); fab.style.display = 'flex'; }
            if (targetId === 'view-expenses') { Expenses.init(tripId); fab.style.display = 'flex'; }
            if (targetId === 'view-places') { Places.init(tripId); fab.style.display = 'none'; } // 內嵌按鈕
            if (targetId === 'view-tools') { Rates.init().then(() => Weather.init()); fab.style.display = 'none'; }
        });
    });

    // 4. 返回首頁
    backBtn.addEventListener('click', () => {
        // 回到首頁狀態
        UI.switchView('view-home');
        topBar.style.display = 'none'; // 首頁不顯示 Top Bar
        bottomNav.classList.remove('visible'); // 隱藏底部導航
        fab.style.display = 'none';
        
        // 重新整理列表 (避免新增後沒更新)
        Trips.init();
    });

    // 5. FAB 功能 (根據當前頁面)
    fab.addEventListener('click', () => {
        if (currentViewId === 'view-events') UI.showModal(Events.getAddForm(), Events.saveFromForm);
        if (currentViewId === 'view-expenses') UI.showModal(Expenses.getAddForm(), Expenses.saveFromForm);
    });

    // 6. Modal 取消
    document.getElementById('btn-cancel').addEventListener('click', () => UI.hideModal());

    // --- 輔助函式: 進入旅行模式 ---
    function enterTripMode(tripId) {
        // 切換到行程頁
        currentViewId = UI.switchView('view-events');
        
        // UI 狀態改變
        topBar.style.display = 'flex'; // 顯示頂部標題與返回鍵
        bottomNav.classList.add('visible'); // 滑入底部導航
        fab.style.display = 'flex';

        // 載入資料
        Events.init(tripId);
    }
});