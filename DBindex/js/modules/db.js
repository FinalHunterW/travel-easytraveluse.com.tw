// js/modules/db.js
const db = new Dexie('TravelPlannerDB');

// 定義資料庫結構 V2
db.version(2).stores({
    // 旅行列表: 標題, 開始日期, 結束日期
    trips: '++id, title, startDate, endDate', 

    // 行程: 增加 tripId
    events: '++id, tripId, title, startTime, type, subType',
    
    // 記帳: 增加 tripId
    expenses: '++id, tripId, category, date, amountTWD',
    
    // 景點: 增加 tripId
    places: '++id, tripId, name, category, area, image',
    
    // 設定
    settings: 'key'
});

export default db;