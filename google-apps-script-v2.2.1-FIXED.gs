// ===============================================
// Google Apps Script - 配信記録自動同期スクリプト v2.2.1
// ===============================================
// 
// 【設定手順】
// 1. Googleスプレッドシートを開く
// 2. 拡張機能 → Apps Script
// 3. このコードを貼り付け（既存コードは全削除）
// 4. 保存（Ctrl+S）
// 5. デプロイ → 新しいデプロイ → 種類: ウェブアプリ
// 6. アクセスできるユーザー: 自分のみ
// 7. デプロイ → URLをコピー
// 8. PWAアプリの設定にURLを貼り付け
//
// ===============================================

// スプレッドシートのシート名
var SHEET_NAMES = {
  RECORDS: 'セッション記録',
  GOALS: '目標設定',
  LOG: '同期ログ'
};

// GET リクエスト処理（接続テスト・データ取得）
function doGet(e) {
  try {
    // eがundefinedの場合の対処
    var params = e && e.parameter ? e.parameter : {};
    var action = params.action || 'test';
    
    Logger.log('doGet called with action: ' + action);
    
    if (action === 'test') {
      // 接続テスト
      return ContentService.createTextOutput(JSON.stringify({
        status: 'ok',
        message: '接続成功',
        timestamp: new Date().toISOString(),
        version: '2.2.1'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'fetch') {
      // データ取得
      var data = fetchAllData();
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        records: data.records,
        goals: data.goals,
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '不明なアクション: ' + action
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error in doGet: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'サーバーエラー: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// POST リクエスト処理（データ同期）
function doPost(e) {
  try {
    // eがundefinedの場合の対処
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('リクエストデータがありません');
    }
    
    var data = JSON.parse(e.postData.contents);
    var action = data.action || 'sync';
    
    Logger.log('doPost called with action: ' + action);
    
    if (action === 'sync') {
      // データを同期
      var recordCount = syncToSheet(data.records, data.goals);
      
      // 同期ログを記録
      logSync(data.timestamp);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'データを同期しました',
        timestamp: new Date().toISOString(),
        recordCount: recordCount
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '不明なアクション: ' + action
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: 'サーバーエラー: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// データをシートに同期
function syncToSheet(records, goals) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // セッション記録シート
  var recordSheet = ss.getSheetByName(SHEET_NAMES.RECORDS);
  if (!recordSheet) {
    recordSheet = ss.insertSheet(SHEET_NAMES.RECORDS);
    initializeRecordSheet(recordSheet);
  }
  
  // 既存データをクリア（ヘッダー以外）
  if (recordSheet.getLastRow() > 1) {
    recordSheet.getRange(2, 1, recordSheet.getLastRow() - 1, recordSheet.getLastColumn()).clearContent();
  }
  
  // レコードを書き込み
  var recordCount = 0;
  if (records && Array.isArray(records) && records.length > 0) {
    var rows = [];
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      rows.push([
        r.date || '',
        r.startTime || '',
        r.endTime || '',
        r.device || '',
        r.health || '',
        r.motivation || '',
        r.totalCustomers || 0,
        r.coinUsers || 0,
        r.nonCoinUsers || 0,
        r.regularCustomers || 0,
        r.paidConversion || 0,
        r.totalSales || 0,
        r.admissionTotal || 0,
        r.tipTotal || 0,
        r.specialReward || 0,
        r.highValueCustomers || 0,
        r.engagedConversations || 0,
        r.talkTheme || '',
        r.salesFlow || '',
        r.successMemo || '',
        r.failureMemo || '',
        r.outfitMemo || '',
        r.tensionLevel || '',
        r.hasEvent ? 'TRUE' : 'FALSE',
        r.salaryPeriod || '',
        r.competitorDensity || '',
        r.hasTrouble ? 'TRUE' : 'FALSE',
        r.workingHours || 0,
        r.salesPerHour || 0,
        r.conversionRate || 0,
        r.coinUserRate || 0,
        r.regularRate || 0,
        r.highValueRate || 0,
        r.tipRatio || 0,
        r.weekday || '',
        r.timeSlot || ''
      ]);
    }
    
    if (rows.length > 0) {
      recordSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      recordCount = rows.length;
    }
  }
  
  // 目標設定シート
  var goalSheet = ss.getSheetByName(SHEET_NAMES.GOALS);
  if (!goalSheet) {
    goalSheet = ss.insertSheet(SHEET_NAMES.GOALS);
    initializeGoalSheet(goalSheet);
  }
  
  // 目標データを書き込み
  if (goals) {
    goalSheet.getRange('B2').setValue(goals.monthlySales || 0);
    goalSheet.getRange('B3').setValue(goals.targetHourlyWage || 0);
    goalSheet.getRange('B4').setValue(goals.monthlySessions || 0);
    goalSheet.getRange('B5').setValue(goals.conversionRate || 0);
  }
  
  return recordCount;
}

// レコードシートを初期化
function initializeRecordSheet(sheet) {
  var headers = [
    '日付', '開始時刻', '終了時刻', 'デバイス', '体調自己評価', 'モチベ自己評価',
    '総客数', 'コインありユーザー数', 'コインなしユーザー数', '常連客数', '有料移行人数',
    '総売上', '入場料合計', 'チップ合計', '特別報酬', '1000コイン以上', '会話が盛り上がった客数',
    'トークテーマ', '営業導線', '成功トークメモ', '失敗トークメモ', '服装/演出メモ', 'テンション帯',
    'イベント有無', '給料日前後', '競合多そう感覚', '通信トラブル有無',
    '総稼働時間(時間)', '1時間あたり売上', '有料移行率', 'コインあり率', '常連率', 
    '高単価客率', 'チップ比率', '曜日', '時間帯カテゴリ'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  
  // 列幅を自動調整
  for (var i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }
}

// 目標シートを初期化
function initializeGoalSheet(sheet) {
  var data = [
    ['目標項目', '目標値'],
    ['月間目標売上', 0],
    ['目標時給', 0],
    ['月間セッション数', 0],
    ['目標有料移行率(%)', 0]
  ];
  
  sheet.getRange(1, 1, data.length, 2).setValues(data);
  sheet.getRange(1, 1, 1, 2)
    .setFontWeight('bold')
    .setBackground('#34a853')
    .setFontColor('#ffffff');
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 150);
}

// 同期ログを記録
function logSync(timestamp) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName(SHEET_NAMES.LOG);
  
  if (!logSheet) {
    logSheet = ss.insertSheet(SHEET_NAMES.LOG);
    logSheet.getRange(1, 1, 1, 3).setValues([['同期日時', 'タイムスタンプ', 'ステータス']]);
    logSheet.getRange(1, 1, 1, 3)
      .setFontWeight('bold')
      .setBackground('#ea4335')
      .setFontColor('#ffffff');
  }
  
  var now = new Date();
  logSheet.appendRow([
    Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm:ss'),
    timestamp || now.getTime(),
    '成功'
  ]);
}

// 全データを取得
function fetchAllData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // レコードを取得
  var recordSheet = ss.getSheetByName(SHEET_NAMES.RECORDS);
  var records = [];
  
  if (recordSheet && recordSheet.getLastRow() > 1) {
    var lastRow = recordSheet.getLastRow();
    var data = recordSheet.getRange(2, 1, lastRow - 1, 36).getValues();
    
    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      records.push({
        date: row[0],
        startTime: row[1],
        endTime: row[2],
        device: row[3],
        health: row[4],
        motivation: row[5],
        totalCustomers: row[6],
        coinUsers: row[7],
        nonCoinUsers: row[8],
        regularCustomers: row[9],
        paidConversion: row[10],
        totalSales: row[11],
        admissionTotal: row[12],
        tipTotal: row[13],
        specialReward: row[14],
        highValueCustomers: row[15],
        engagedConversations: row[16],
        talkTheme: row[17],
        salesFlow: row[18],
        successMemo: row[19],
        failureMemo: row[20],
        outfitMemo: row[21],
        tensionLevel: row[22],
        hasEvent: row[23] === 'TRUE',
        salaryPeriod: row[24],
        competitorDensity: row[25],
        hasTrouble: row[26] === 'TRUE',
        workingHours: row[27],
        salesPerHour: row[28],
        conversionRate: row[29],
        coinUserRate: row[30],
        regularRate: row[31],
        highValueRate: row[32],
        tipRatio: row[33],
        weekday: row[34],
        timeSlot: row[35]
      });
    }
  }
  
  // 目標を取得
  var goalSheet = ss.getSheetByName(SHEET_NAMES.GOALS);
  var goals = {};
  
  if (goalSheet) {
    goals = {
      monthlySales: goalSheet.getRange('B2').getValue() || 0,
      targetHourlyWage: goalSheet.getRange('B3').getValue() || 0,
      monthlySessions: goalSheet.getRange('B4').getValue() || 0,
      conversionRate: goalSheet.getRange('B5').getValue() || 0
    };
  }
  
  return { records: records, goals: goals };
}

// テスト用関数（デバッグ用）
function testDoGet() {
  var result = doGet({ parameter: { action: 'test' } });
  Logger.log(result.getContent());
}

function testDoPost() {
  var testData = {
    postData: {
      contents: JSON.stringify({
        action: 'sync',
        records: [],
        goals: {},
        timestamp: Date.now()
      })
    }
  };
  var result = doPost(testData);
  Logger.log(result.getContent());
}
