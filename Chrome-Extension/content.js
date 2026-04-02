// content.js - Final Version
// Detects Open signals from Strategy Tester and sends to local server

console.log("📊 TradingView Signal Reader v3.0 - Active");

let trackedTrades = new Set();
let scanInterval = null;
const SERVER_URL = "http://localhost:8080/signal";

// Send signal to local server
function sendToServer(signalData) {
    // Convert to format EA expects: "BUY SL=50 TP=50 LOT=0.01"
    const signalText = `${signalData.direction} SL=${signalData.stop_ticks} TP=${signalData.stop_ticks} LOT=${signalData.lot_size}`;
    
    // Send to server
    fetch('http://localhost:8080/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signal: signalText })
    });
}

// Show notification on chart
function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = `📊 ${message}`;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#1e1e1e';
    notification.style.color = '#4caf50';
    notification.style.padding = '10px 15px';
    notification.style.borderRadius = '5px';
    notification.style.fontFamily = 'monospace';
    notification.style.fontSize = '11px';
    notification.style.zIndex = '999999';
    notification.style.border = '1px solid #4caf50';
    notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification && notification.remove) {
            notification.remove();
        }
    }, 3000);
}

// Backup to storage if server is down
function saveToStorageBackup(signalText) {
    chrome.storage.local.get(['backupSignals'], function(result) {
        let backups = result.backupSignals || [];
        backups.unshift({
            signal: signalText,
            time: new Date().toLocaleString()
        });
        if (backups.length > 50) backups = backups.slice(0, 50);
        chrome.storage.local.set({ backupSignals: backups });
        console.log("📋 Signal saved to backup storage");
    });
}

// Parse Open signal: OpenB|D62|L0.08|S1
function parseOpenSignal(signalText) {
    const pattern = /Open([BS])\|D(\d+)\|L([\d.]+)\|S(\d+)/i;
    const match = signalText.match(pattern);
    
    if (match) {
        const directionLetter = match[1].toUpperCase();
        const stopTicks = parseInt(match[2]);
        const lotSize = parseFloat(match[3]);
        const step = parseInt(match[4]);
        
        return {
            direction: directionLetter === 'B' ? 'BUY' : 'SELL',
            stop_ticks: stopTicks,
            lot_size: lotSize,
            step: step,
            timestamp: Date.now()
        };
    }
    return null;
}

// Find the Strategy Tester trades table
function findTradesTable() {
    const rows = document.querySelectorAll('tr.ka-tr.ka-row');
    if (rows.length > 0) {
        const container = rows[0].closest('tbody');
        if (container) return container;
    }
    
    const selectors = [
        '[class*="strategy-tester"] table',
        '[data-name="list-of-trades"]',
        '.tv-data-table__tbody',
        '[class*="trades"] tbody'
    ];
    
    for (let selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
    }
    return null;
}

// Process trade row
function processTradeRow(row) {
    const cells = row.querySelectorAll('td');
    let signalText = "";
    
    for (let text of Array.from(cells).map(cell => cell.textContent.trim())) {
        if (text.match(/Open[BS]\|D\d+\|L[\d.]+\|S\d+/i)) {
            signalText = text;
            break;
        }
    }
    
    if (!signalText) return null;
    return parseOpenSignal(signalText);
}

// Scan for new trades
function scanForNewTrades() {
    const container = findTradesTable();
    if (!container) return;
    
    const rows = container.querySelectorAll('tr');
    
    rows.forEach(row => {
        const rowText = row.textContent.trim();
        if (!rowText || rowText.includes('Time') || rowText.includes('Type') || rowText.length < 10) return;
        
        const hasOpenSignal = rowText.match(/Open[BS]\|D\d+\|L[\d.]+\|S\d+/i);
        
        if (hasOpenSignal && !trackedTrades.has(rowText)) {
            trackedTrades.add(rowText);
            const signal = processTradeRow(row);
            
            if (signal) {
                console.log("🔔 NEW TRADE DETECTED!", signal);
                sendToServer(signal);
                saveToHistory(signal);
            }
        }
    });
    
    // Clean old tracked trades
    if (trackedTrades.size > 500) {
        const iterator = trackedTrades.values();
        for (let i = 0; i < 100; i++) {
            trackedTrades.delete(iterator.next().value);
        }
    }
}

// Save to history for popup
function saveToHistory(signal) {
    chrome.storage.local.get(['trades'], function(result) {
        let trades = result.trades || [];
        trades.unshift({
            ...signal,
            time: new Date().toLocaleString()
        });
        if (trades.length > 200) trades = trades.slice(0, 200);
        chrome.storage.local.set({ trades: trades });
    });
}

// Start scanning
function startScanning() {
    if (scanInterval) clearInterval(scanInterval);
    scanInterval = setInterval(() => scanForNewTrades(), 100);
    console.log("✅ Scanning every 100ms - Sending to server at", SERVER_URL);
}

// Initialize
function init() {
    const container = findTradesTable();
    if (container) {
        console.log("✅ Strategy Tester found, starting scanner");
        startScanning();
    } else {
        console.log("⚠️ Strategy Tester not found, retrying in 2 seconds...");
        setTimeout(init, 2000);
    }
}

setTimeout(init, 2000);
setTimeout(init, 5000);
