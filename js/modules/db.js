// js/modules/db.js
const db = new Dexie('TravelPlannerDB');

// 定義資料庫結構 V2
db.version(2).stores({
    // 旅行列表
    trips: '++id, title, startDate, endDate', 

    // 行程
    events: '++id, tripId, title, startTime, type, subType',
    
    // 記帳
    expenses: '++id, tripId, category, date, amountTWD',
    
    // 景點: 新增 googleLink 欄位
    places: '++id, tripId, name, category, area, image, googleLink',
    
    // 設定
    settings: 'key'
});

export default db;
