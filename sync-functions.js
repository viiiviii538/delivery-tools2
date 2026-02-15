// 同期関連の関数

// 設定を読み込み
function loadSyncSettings() {
    const url = syncManager.scriptUrl;
    const autoSync = syncManager.autoSync;
    const wifiOnly = syncManager.wifiOnly;
    
    document.getElementById('gas-script-url').value = url;
    document.getElementById('auto-sync-enabled').checked = autoSync;
    document.getElementById('wifi-only-sync').checked = wifiOnly;
    
    syncManager.updateSyncUI();
}

// 設定を保存
function saveSyncSettings() {
    const url = document.getElementById('gas-script-url').value.trim();
    const autoSync = document.getElementById('auto-sync-enabled').checked;
    const wifiOnly = document.getElementById('wifi-only-sync').checked;
    
    syncManager.setScriptUrl(url);
    syncManager.setAutoSync(autoSync);
    syncManager.setWifiOnly(wifiOnly);
    
    showNotification('✅ 設定を保存しました');
}

// 接続テスト
async function testConnection() {
    saveSyncSettings();
    
    if (!syncManager.scriptUrl) {
        showNotification('❌ スクリプトURLを入力してください', 'error');
        return;
    }
    
    showNotification('🔌 接続テスト中...', 'info');
    
    try {
        const result = await syncManager.testConnection();
        showNotification(result.message, 'success');
    } catch (error) {
        showNotification('❌ ' + error.message, 'error');
    }
}

// 手動同期
async function manualSync() {
    saveSyncSettings();
    
    if (!syncManager.scriptUrl) {
        showNotification('❌ スクリプトURLを設定してください', 'error');
        return;
    }
    
    showNotification('🔄 同期中...', 'info');
    
    try {
        const result = await syncManager.syncData(streamingRecords, streamingGoals);
        if (result.success) {
            showNotification('✅ ' + result.message, 'success');
        } else {
            showNotification('⚠️ ' + result.message, 'warning');
        }
    } catch (error) {
        showNotification('❌ 同期エラー: ' + error.message, 'error');
    }
}

// データ保存時に自動同期
async function autoSyncIfEnabled() {
    if (syncManager.autoSync && syncManager.scriptUrl) {
        // バックグラウンドで同期（エラーは無視）
        syncManager.syncData(streamingRecords, streamingGoals).catch(err => {
            console.log('Auto-sync failed (will retry later):', err);
        });
    }
}

// スプレッドシートからデータをインポート
async function importFromSheet() {
    if (!syncManager.scriptUrl) {
        showNotification('❌ スクリプトURLを設定してください', 'error');
        return;
    }
    
    if (!confirm('スプレッドシートのデータで上書きしますか？\n現在のローカルデータは失われます。')) {
        return;
    }
    
    showNotification('📥 データ取得中...', 'info');
    
    try {
        const result = await syncManager.fetchData();
        if (result.success) {
            streamingRecords = result.records || [];
            streamingGoals = result.goals || {};
            saveData();
            saveGoals();
            refreshDashboard();
            refreshCalendar();
            showNotification('✅ データをインポートしました', 'success');
            switchTab('dashboard');
        }
    } catch (error) {
        showNotification('❌ インポートエラー: ' + error.message, 'error');
    }
}

// 通知表示
function showNotification(message, type = 'info') {
    // 既存の通知を削除
    const existing = document.querySelector('.app-notification');
    if (existing) existing.remove();
    
    // 新しい通知を作成
    const notification = document.createElement('div');
    notification.className = `app-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideDown 0.3s ease-out;
        max-width: 90%;
    `;
    
    // タイプごとの色
    const colors = {
        success: 'background: #d1fae5; color: #065f46; border: 2px solid #10b981;',
        error: 'background: #fee2e2; color: #991b1b; border: 2px solid #ef4444;',
        warning: 'background: #fef3c7; color: #92400e; border: 2px solid #f59e0b;',
        info: 'background: #dbeafe; color: #1e40af; border: 2px solid #3b82f6;'
    };
    
    notification.style.cssText += colors[type] || colors.info;
    
    document.body.appendChild(notification);
    
    // 3秒後に削除
    setTimeout(() => {
        notification.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// アニメーション
const style = document.createElement('style');
style.textContent = `
@keyframes slideDown {
    from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
    to { transform: translateX(-50%) translateY(0); opacity: 1; }
}
@keyframes slideUp {
    from { transform: translateX(-50%) translateY(0); opacity: 1; }
    to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
}
`;
document.head.appendChild(style);
