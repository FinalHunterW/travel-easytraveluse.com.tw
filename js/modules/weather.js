// js/modules/weather.js
export const Weather = {
    cities: [
        { name: '大阪 (Osaka)', lat: 34.6937, lon: 135.5023 },
        { name: '京都 (Kyoto)', lat: 35.0116, lon: 135.7681 },
        { name: '東京 (Tokyo)', lat: 35.6895, lon: 139.6917 },
        { name: '台北 (Taipei)', lat: 25.0330, lon: 121.5654 }
    ],

    init: () => {
        const container = document.getElementById('weather-card-container');
        if (!container) return;

        container.innerHTML = `
            <div class="card" style="margin-top:16px;">
                <h3 style="margin-bottom:12px;">🌤️ 當地天氣</h3>
                <div style="display:flex; gap:8px; margin-bottom:16px;">
                    <select id="weather-city-select" style="flex:1;">
                        ${Weather.cities.map((c, index) => `<option value="${index}">${c.name}</option>`).join('')}
                    </select>
                    <button id="btn-refresh-weather" class="text-btn" style="flex:none; width:auto; padding:0 12px; font-size:14px;">重新整理</button>
                </div>
                
                <div id="weather-display" style="text-align:center; min-height:100px; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                    <p style="color:var(--ios-gray);">載入中...</p>
                </div>
            </div>
        `;

        const select = document.getElementById('weather-city-select');
        const btn = document.getElementById('btn-refresh-weather');

        // 預設查詢第一個城市
        Weather.fetchWeather(Weather.cities[0]);

        btn.addEventListener('click', () => {
            const city = Weather.cities[select.value];
            Weather.fetchWeather(city);
        });

        select.addEventListener('change', (e) => {
            const city = Weather.cities[e.target.value];
            Weather.fetchWeather(city);
        });
    },

    fetchWeather: async (city) => {
        const display = document.getElementById('weather-display');
        display.innerHTML = '<p>更新中...</p>';

        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&timezone=auto`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error('網路錯誤');
            
            const data = await res.json();
            const current = data.current_weather;

            let icon = '☀️';
            if (current.weathercode > 3) icon = '☁️';
            if (current.weathercode > 45) icon = '🌫️';
            if (current.weathercode > 60) icon = '🌧️';
            if (current.weathercode > 80) icon = '⛈️';

            display.innerHTML = `
                <div style="font-size:3.5rem; margin-bottom:4px;">${icon}</div>
                <div style="font-size:2rem; font-weight:600;">${current.temperature}°C</div>
                <div style="color:var(--text-secondary); font-size:0.9rem; margin-top:8px;">
                    風速: ${current.windspeed} km/h
                </div>
            `;
        } catch (err) {
            console.error(err);
            display.innerHTML = `<p style="color:var(--ios-red);">無法取得天氣 (請檢查網路)</p>`;
        }
    }
};