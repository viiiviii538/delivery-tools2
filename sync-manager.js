// Google Apps Script 自動同期マネージャー
class SyncManager {
  constructor() {
    this.scriptUrl = localStorage.getItem('gas_script_url') || '';
    this.autoSync = localStorage.getItem('auto_sync') !== 'false';
    this.wifiOnly = localStorage.getItem('wifi_only') === 'true';
    this.lastSyncTime = localStorage.getItem('last_sync_time') || '';
    this.syncStatus = 'idle'; // idle, syncing, success, error
    this.pendingData = JSON.parse(localStorage.getItem('pending_sync') || '[]');
  }

  // スクリプトURLを設定
  setScriptUrl(url) {
    this.scriptUrl = url;
    localStorage.setItem('gas_script_url', url);
  }

  // 自動同期ON/OFF
  setAutoSync(enabled) {
    this.autoSync = enabled;
    localStorage.setItem('auto_sync', enabled);
  }

  // WiFi限定ON/OFF
  setWifiOnly(enabled) {
    this.wifiOnly = enabled;
    localStorage.setItem('wifi_only', enabled);
  }

  // 同期可能かチェック
  canSync() {
    if (!this.scriptUrl) return false;
    if (!navigator.onLine) return false;
    
    // WiFi限定チェック（実際のWiFi判定は難しいので簡易版）
    if (this.wifiOnly) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection && connection.type && connection.type !== 'wifi') {
        return false;
      }
    }
    return true;
  }

  // 接続テスト
  async testConnection() {
    if (!this.scriptUrl) {
      throw new Error('スクリプトURLが設定されていません');
    }

    try {
      const response = await fetch(this.scriptUrl + '?action=test', {
        method: 'GET',
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error('接続に失敗しました');
      }

      const data = await response.json();
      if (data.status === 'ok') {
        return { success: true, message: '接続成功！' };
      } else {
        throw new Error('スクリプトの応答が不正です');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      throw new Error('接続テストに失敗: ' + error.message);
    }
  }

  // データを同期
  async syncData(records, goals) {
    if (!this.canSync()) {
      // オフラインの場合はペンディングキューに追加
      this.addToPending({ records, goals, timestamp: Date.now() });
      return { success: false, message: 'オフライン - 後で同期します' };
    }

    this.syncStatus = 'syncing';
    this.updateSyncUI();

    try {
      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync',
          records: records,
          goals: goals,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error('同期に失敗しました（ステータス: ' + response.status + '）');
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        this.syncStatus = 'success';
        this.lastSyncTime = new Date().toISOString();
        localStorage.setItem('last_sync_time', this.lastSyncTime);
        
        // ペンディングデータをクリア
        this.clearPending();
        
        this.updateSyncUI();
        return { success: true, message: '同期完了！', data: data };
      } else {
        throw new Error(data.message || '同期に失敗しました');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      this.syncStatus = 'error';
      this.addToPending({ records, goals, timestamp: Date.now() });
      this.updateSyncUI();
      return { success: false, message: '同期エラー: ' + error.message };
    }
  }

  // スプレッドシートからデータを取得
  async fetchData() {
    if (!this.canSync()) {
      throw new Error('オフラインのため取得できません');
    }

    try {
      const response = await fetch(this.scriptUrl + '?action=fetch', {
        method: 'GET',
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error('データ取得に失敗しました');
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          success: true,
          records: data.records || [],
          goals: data.goals || {}
        };
      } else {
        throw new Error(data.message || 'データ取得に失敗しました');
      }
    } catch (error) {
      console.error('Fetch failed:', error);
      throw error;
    }
  }

  // ペンディングキューに追加
  addToPending(data) {
    this.pendingData.push(data);
    localStorage.setItem('pending_sync', JSON.stringify(this.pendingData));
  }

  // ペンディングデータをクリア
  clearPending() {
    this.pendingData = [];
    localStorage.removeItem('pending_sync');
  }

  // ペンディングデータを同期
  async syncPending() {
    if (this.pendingData.length === 0) return;
    if (!this.canSync()) return;

    console.log('Syncing pending data...', this.pendingData.length, 'items');

    // 最新のデータのみ送信
    const latestData = this.pendingData[this.pendingData.length - 1];
    const result = await this.syncData(latestData.records, latestData.goals);
    
    if (result.success) {
      this.clearPending();
    }
  }

  // 同期UIを更新
  updateSyncUI() {
    const statusElement = document.getElementById('sync-status');
    const lastSyncElement = document.getElementById('last-sync-time');
    
    if (statusElement) {
      switch (this.syncStatus) {
        case 'syncing':
          statusElement.innerHTML = '⏳ 同期中...';
          statusElement.className = 'sync-status syncing';
          break;
        case 'success':
          statusElement.innerHTML = '✅ 同期済み';
          statusElement.className = 'sync-status success';
          break;
        case 'error':
          statusElement.innerHTML = '❌ 同期エラー';
          statusElement.className = 'sync-status error';
          break;
        default:
          statusElement.innerHTML = '⏸️ 待機中';
          statusElement.className = 'sync-status idle';
      }
    }

    if (lastSyncElement && this.lastSyncTime) {
      const date = new Date(this.lastSyncTime);
      lastSyncElement.textContent = date.toLocaleString('ja-JP');
    }

    // ペンディング表示
    const pendingElement = document.getElementById('pending-count');
    if (pendingElement) {
      if (this.pendingData.length > 0) {
        pendingElement.textContent = `未同期: ${this.pendingData.length}件`;
        pendingElement.style.display = 'block';
      } else {
        pendingElement.style.display = 'none';
      }
    }
  }

  // 同期ステータスを取得
  getStatus() {
    return {
      configured: !!this.scriptUrl,
      autoSync: this.autoSync,
      wifiOnly: this.wifiOnly,
      lastSync: this.lastSyncTime,
      status: this.syncStatus,
      pendingCount: this.pendingData.length,
      canSync: this.canSync()
    };
  }
}

// グローバルインスタンス
const syncManager = new SyncManager();

// オンライン復帰時に自動同期
window.addEventListener('online', () => {
  console.log('Network online - attempting to sync pending data');
  setTimeout(() => {
    syncManager.syncPending();
  }, 1000);
});

// 定期的にペンディングデータをチェック（5分ごと）
setInterval(() => {
  if (syncManager.pendingData.length > 0 && syncManager.canSync()) {
    syncManager.syncPending();
  }
}, 5 * 60 * 1000);
