// popup.js

let lastCheck = 0;

function loadSignals() {
    chrome.storage.local.get(['trades'], function(result) {
        const trades = result.trades || [];
        const container = document.getElementById('signalList');
        
        // Update stats
        const total = trades.length;
        const buys = trades.filter(t => t.direction === 'BUY').length;
        const sells = trades.filter(t => t.direction === 'SELL').length;
        const today = trades.filter(t => t.time.includes(new Date().toLocaleDateString())).length;
        
        document.getElementById('totalCount').textContent = total;
        document.getElementById('buyCount').textContent = buys;
        document.getElementById('sellCount').textContent = sells;
        document.getElementById('todayCount').textContent = today;
        
        if (trades.length === 0) {
            container.innerHTML = '<div class="empty">📭 No signals yet<br>Waiting for OpenB|D...|L...|S...</div>';
            return;
        }
        
        container.innerHTML = trades.map(t => `
            <div class="signal-item ${t.direction}">
                <div class="signal-time">${t.time}</div>
                <div class="signal-main">${t.direction} | Stop: ${t.stop_ticks} ticks | Lot: ${t.lot_size} | Step: ${t.step}</div>
                <div class="signal-details">
                    <div class="detail">📊 ${t.direction}</div>
                    <div class="detail">🎯 ${t.stop_ticks} ticks</div>
                    <div class="detail">📦 ${t.lot_size} lots</div>
                    <div class="detail">🔢 Step ${t.step}</div>
                </div>
            </div>
        `).join('');
    });
}

function checkServerStatus() {
    fetch('http://localhost:8080/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (response.ok) {
            document.getElementById('serverStatus').textContent = 'Online';
            document.getElementById('serverStatus').className = 'status-online';
        } else {
            throw new Error('Server not responding');
        }
    })
    .catch(() => {
        document.getElementById('serverStatus').textContent = 'Offline - Start server.py';
        document.getElementById('serverStatus').className = 'status-offline';
    });
}

document.getElementById('refreshBtn').onclick = loadSignals;
document.getElementById('clearBtn').onclick = () => {
    if (confirm('Clear all captured signals?')) {
        chrome.storage.local.set({ trades: [] }, loadSignals);
    }
};

setInterval(loadSignals, 1000);
setInterval(checkServerStatus, 5000);
loadSignals();
checkServerStatus();
