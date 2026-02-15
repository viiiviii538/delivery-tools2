// データストレージ
let records = [];
let goals = [];
let currentViewMonth = new Date(); // 現在表示中の月
let currentCalendarMonth = new Date(); // カレンダー表示中の月
let currentStatsMonth = new Date(); // 統計表示中の月

// LocalStorageからデータを読み込み
function loadData() {
    const savedData = localStorage.getItem('streamingRecords');
    if (savedData) {
        records = JSON.parse(savedData);
    }
    
    const savedGoals = localStorage.getItem('streamingGoals');
    if (savedGoals) {
        goals = JSON.parse(savedGoals);
    }
    
    updateDashboard();
    updateCalendar();
}

// データを保存
function saveData() {
    localStorage.setItem('streamingRecords', JSON.stringify(records));
}

// 目標を保存
function saveGoals() {
    localStorage.setItem('streamingGoals', JSON.stringify(goals));
}

// 月の文字列を取得 (YYYY-MM形式)
function getMonthString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

// 月の表示文字列を取得
function getMonthDisplayString(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}年${month}月`;
}

// 指定月のレコードをフィルタ
function getRecordsForMonth(date) {
    const monthStr = getMonthString(date);
    return records.filter(r => r.date.startsWith(monthStr));
}

// 月を変更
function changeMonth(delta) {
    currentViewMonth.setMonth(currentViewMonth.getMonth() + delta);
    updateDashboard();
    updateGoalProgress();
}

function changeCalendarMonth(delta) {
    currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + delta);
    updateCalendar();
}

function changeStatsMonth(delta) {
    currentStatsMonth.setMonth(currentStatsMonth.getMonth() + delta);
    updateCharts();
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    // 今日の日付をデフォルトに設定
    document.getElementById('date').valueAsDate = new Date();
    
    // 目標月のデフォルト値
    const now = new Date();
    document.getElementById('goalMonth').value = getMonthString(now);
    
    // 星評価の初期化
    updateStarDisplay('health', 3);
    updateStarDisplay('motivation', 3);
    
    // データ読み込み
    loadData();
    
    // 月表示の更新
    updateMonthDisplays();
    
    // フォーム送信
    document.getElementById('recordForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveRecord();
    });
    
    document.getElementById('goalForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveGoal();
    });
});

// 月表示を更新
function updateMonthDisplays() {
    document.getElementById('currentMonthDisplay').textContent = getMonthDisplayString(currentViewMonth);
    document.getElementById('calendarMonthDisplay').textContent = getMonthDisplayString(currentCalendarMonth);
    document.getElementById('statsMonthDisplay').textContent = getMonthDisplayString(currentStatsMonth);
}

// タブ切り替え
function showTab(tabName) {
    // すべてのタブを非表示
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // すべてのタブボタンを非アクティブ
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 選択されたタブを表示
    document.getElementById(tabName + '-tab').classList.remove('hidden');
    
    // タブボタンをアクティブ化
    event.target.classList.add('active');
    
    // 各タブの更新
    if (tabName === 'stats') {
        updateCharts();
    } else if (tabName === 'calendar') {
        updateCalendar();
    } else if (tabName === 'goals') {
        loadSavedGoals();
    } else if (tabName === 'home') {
        updateGoalProgress();
    }
}

// 星評価の設定
function setRating(field, event) {
    if (event.target.tagName === 'SPAN') {
        const value = parseInt(event.target.getAttribute('data-value'));
        document.getElementById(field).value = value;
        updateStarDisplay(field, value);
    }
}

// 星評価の表示更新
function updateStarDisplay(field, value) {
    const container = document.getElementById(field + 'Rating');
    const stars = container.querySelectorAll('span');
    stars.forEach((star, index) => {
        if (index < value) {
            star.textContent = '★';
        } else {
            star.textContent = '☆';
        }
    });
}

// 稼働時間を計算（時間単位）
function calculateWorkingHours(startTime, endTime) {
    const start = new Date('2000-01-01 ' + startTime);
    let end = new Date('2000-01-01 ' + endTime);
    
    if (end < start) {
        end.setDate(end.getDate() + 1);
    }
    
    const diffMs = end - start;
    const diffHours = diffMs / (1000 * 60 * 60);
    return diffHours;
}

// 記録を保存
function saveRecord() {
    const date = document.getElementById('date').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const device = document.getElementById('device').value;
    const health = parseInt(document.getElementById('health').value);
    const motivation = parseInt(document.getElementById('motivation').value);
    
    const totalCustomers = parseInt(document.getElementById('totalCustomers').value);
    const coinUsers = parseInt(document.getElementById('coinUsers').value);
    const regularCustomers = parseInt(document.getElementById('regularCustomers').value);
    const paidUsers = parseInt(document.getElementById('paidUsers').value);
    const highSpenders = parseInt(document.getElementById('highSpenders').value);
    
    const totalSales = parseInt(document.getElementById('totalSales').value);
    const entranceFee = parseInt(document.getElementById('entranceFee').value);
    const tips = parseInt(document.getElementById('tips').value);
    const specialReward = parseInt(document.getElementById('specialReward').value);
    
    const talkTheme = document.getElementById('talkTheme').value;
    const salesApproach = document.getElementById('salesApproach').value;
    const tension = document.getElementById('tension').value;
    const successMemo = document.getElementById('successMemo').value;
    const failureMemo = document.getElementById('failureMemo').value;
    
    const hasEvent = document.getElementById('hasEvent').value === 'true';
    const payday = document.getElementById('payday').value;
    
    // 自動計算
    const workingHours = calculateWorkingHours(startTime, endTime);
    const hourlyWage = workingHours > 0 ? Math.round(totalSales / workingHours) : 0;
    const paidConversionRate = totalCustomers > 0 ? (paidUsers / totalCustomers) : 0;
    const coinUserRate = totalCustomers > 0 ? (coinUsers / totalCustomers) : 0;
    const regularRate = totalCustomers > 0 ? (regularCustomers / totalCustomers) : 0;
    const highSpenderRate = totalCustomers > 0 ? (highSpenders / totalCustomers) : 0;
    const tipRate = totalSales > 0 ? (tips / totalSales) : 0;
    
    const dateObj = new Date(date);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    const weekday = weekdays[dateObj.getDay()];
    
    const hour = parseInt(startTime.split(':')[0]);
    let timeCategory;
    if (hour < 6) timeCategory = '深夜';
    else if (hour < 12) timeCategory = '午前';
    else if (hour < 17) timeCategory = '午後';
    else timeCategory = '夜';
    
    const record = {
        date, startTime, endTime, device, health, motivation,
        totalCustomers, coinUsers, regularCustomers, paidUsers, highSpenders,
        totalSales, entranceFee, tips, specialReward,
        talkTheme, salesApproach, tension, successMemo, failureMemo,
        hasEvent, payday,
        workingHours, hourlyWage, paidConversionRate, coinUserRate,
        regularRate, highSpenderRate, tipRate, weekday, timeCategory
    };
    
    records.push(record);
    saveData();
    
    alert('✅ 記録を保存しました！');
    document.getElementById('recordForm').reset();
    document.getElementById('date').valueAsDate = new Date();
    updateStarDisplay('health', 3);
    updateStarDisplay('motivation', 3);
    
    updateDashboard();
    updateCalendar();
    updateGoalProgress();
    
    showTab('home');
}

// 目標を保存
function saveGoal() {
    const monthStr = document.getElementById('goalMonth').value;
    const monthlySales = parseInt(document.getElementById('goalMonthlySales').value) || 0;
    const hourlyWage = parseInt(document.getElementById('goalHourlyWage').value) || 0;
    const sessions = parseInt(document.getElementById('goalSessions').value) || 0;
    const conversionRate = parseFloat(document.getElementById('goalConversionRate').value) || 0;
    
    // 既存の目標を更新または新規追加
    const existingIndex = goals.findIndex(g => g.month === monthStr);
    const goal = {
        month: monthStr,
        monthlySales,
        hourlyWage,
        sessions,
        conversionRate: conversionRate / 100 // パーセントを小数に変換
    };
    
    if (existingIndex >= 0) {
        goals[existingIndex] = goal;
    } else {
        goals.push(goal);
    }
    
    saveGoals();
    alert('✅ 目標を保存しました！');
    loadSavedGoals();
    updateGoalProgress();
}

// 保存済み目標を表示
function loadSavedGoals() {
    const container = document.getElementById('savedGoalsList');
    if (goals.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">まだ目標が設定されていません</p>';
        return;
    }
    
    // 月の降順でソート
    const sortedGoals = [...goals].sort((a, b) => b.month.localeCompare(a.month));
    
    container.innerHTML = sortedGoals.map(goal => {
        const [year, month] = goal.month.split('-');
        return `
            <div class="bg-gray-50 p-4 rounded-lg mb-3">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-bold text-gray-800">${year}年${parseInt(month)}月</h4>
                    <button onclick="deleteGoal('${goal.month}')" class="text-red-500 text-sm">削除</button>
                </div>
                <div class="text-sm text-gray-600 space-y-1">
                    ${goal.monthlySales > 0 ? `<div>💰 月間売上: ¥${goal.monthlySales.toLocaleString()}</div>` : ''}
                    ${goal.hourlyWage > 0 ? `<div>⏱ 目標時給: ¥${goal.hourlyWage.toLocaleString()}</div>` : ''}
                    ${goal.sessions > 0 ? `<div>📊 セッション数: ${goal.sessions}回</div>` : ''}
                    ${goal.conversionRate > 0 ? `<div>🎯 有料移行率: ${(goal.conversionRate * 100).toFixed(1)}%</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// 目標を削除
function deleteGoal(monthStr) {
    if (confirm('この目標を削除しますか？')) {
        goals = goals.filter(g => g.month !== monthStr);
        saveGoals();
        loadSavedGoals();
        updateGoalProgress();
    }
}

// 目標達成状況を更新
function updateGoalProgress() {
    const monthStr = getMonthString(currentViewMonth);
    const goal = goals.find(g => g.month === monthStr);
    
    const progressDiv = document.getElementById('goalProgress');
    const contentDiv = document.getElementById('goalProgressContent');
    
    if (!goal) {
        progressDiv.classList.add('hidden');
        return;
    }
    
    progressDiv.classList.remove('hidden');
    
    const monthRecords = getRecordsForMonth(currentViewMonth);
    
    if (monthRecords.length === 0) {
        contentDiv.innerHTML = '<p class="text-gray-600">まだこの月の記録がありません</p>';
        return;
    }
    
    // 実績計算
    const actualSales = monthRecords.reduce((sum, r) => sum + r.totalSales, 0);
    const avgHourlyWage = Math.round(monthRecords.reduce((sum, r) => sum + r.hourlyWage, 0) / monthRecords.length);
    const actualSessions = monthRecords.length;
    const avgConversionRate = monthRecords.reduce((sum, r) => sum + r.paidConversionRate, 0) / monthRecords.length;
    
    let progressHTML = '<div class="space-y-4">';
    
    // 月間売上目標
    if (goal.monthlySales > 0) {
        const progress = (actualSales / goal.monthlySales) * 100;
        const exceeded = progress >= 100;
        progressHTML += `
            <div>
                <div class="flex justify-between mb-1">
                    <span class="font-semibold">💰 月間売上</span>
                    <span class="text-sm">${exceeded ? '✅' : ''} ¥${actualSales.toLocaleString()} / ¥${goal.monthlySales.toLocaleString()}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${exceeded ? 'exceeded' : ''}" style="width: ${Math.min(progress, 100)}%"></div>
                </div>
                <div class="text-right text-sm text-gray-600 mt-1">${progress.toFixed(1)}%</div>
            </div>
        `;
    }
    
    // 目標時給
    if (goal.hourlyWage > 0) {
        const progress = (avgHourlyWage / goal.hourlyWage) * 100;
        const exceeded = progress >= 100;
        progressHTML += `
            <div>
                <div class="flex justify-between mb-1">
                    <span class="font-semibold">⏱ 平均時給</span>
                    <span class="text-sm">${exceeded ? '✅' : ''} ¥${avgHourlyWage.toLocaleString()} / ¥${goal.hourlyWage.toLocaleString()}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${exceeded ? 'exceeded' : ''}" style="width: ${Math.min(progress, 100)}%"></div>
                </div>
                <div class="text-right text-sm text-gray-600 mt-1">${progress.toFixed(1)}%</div>
            </div>
        `;
    }
    
    // セッション数目標
    if (goal.sessions > 0) {
        const progress = (actualSessions / goal.sessions) * 100;
        const exceeded = progress >= 100;
        progressHTML += `
            <div>
                <div class="flex justify-between mb-1">
                    <span class="font-semibold">📊 セッション数</span>
                    <span class="text-sm">${exceeded ? '✅' : ''} ${actualSessions}回 / ${goal.sessions}回</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${exceeded ? 'exceeded' : ''}" style="width: ${Math.min(progress, 100)}%"></div>
                </div>
                <div class="text-right text-sm text-gray-600 mt-1">${progress.toFixed(1)}%</div>
            </div>
        `;
    }
    
    // 有料移行率目標
    if (goal.conversionRate > 0) {
        const progress = (avgConversionRate / goal.conversionRate) * 100;
        const exceeded = progress >= 100;
        progressHTML += `
            <div>
                <div class="flex justify-between mb-1">
                    <span class="font-semibold">🎯 有料移行率</span>
                    <span class="text-sm">${exceeded ? '✅' : ''} ${(avgConversionRate * 100).toFixed(1)}% / ${(goal.conversionRate * 100).toFixed(1)}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${exceeded ? 'exceeded' : ''}" style="width: ${Math.min(progress, 100)}%"></div>
                </div>
                <div class="text-right text-sm text-gray-600 mt-1">${progress.toFixed(1)}%</div>
            </div>
        `;
    }
    
    progressHTML += '</div>';
    contentDiv.innerHTML = progressHTML;
}

// ダッシュボード更新
function updateDashboard() {
    updateMonthDisplays();
    
    const monthRecords = getRecordsForMonth(currentViewMonth);
    
    if (monthRecords.length === 0) {
        document.getElementById('total-sales').textContent = '¥0';
        document.getElementById('avg-hourly').textContent = '¥0';
        document.getElementById('total-sessions').textContent = '0';
        document.getElementById('avg-customers').textContent = '0';
        return;
    }
    
    const totalSales = monthRecords.reduce((sum, r) => sum + r.totalSales, 0);
    const avgHourlyWage = Math.round(monthRecords.reduce((sum, r) => sum + r.hourlyWage, 0) / monthRecords.length);
    const totalSessions = monthRecords.length;
    const avgCustomers = Math.round(monthRecords.reduce((sum, r) => sum + r.totalCustomers, 0) / monthRecords.length);
    
    document.getElementById('total-sales').textContent = '¥' + totalSales.toLocaleString();
    document.getElementById('avg-hourly').textContent = '¥' + avgHourlyWage.toLocaleString();
    document.getElementById('total-sessions').textContent = totalSessions;
    document.getElementById('avg-customers').textContent = avgCustomers;
    
    updateHomePieChart();
}

// ホーム画面の売上内訳円グラフ
function updateHomePieChart() {
    const canvas = document.getElementById('salesPieChart');
    if (!canvas) return;
    
    const monthRecords = getRecordsForMonth(currentViewMonth);
    const totalEntrance = monthRecords.reduce((sum, r) => sum + r.entranceFee, 0);
    const totalTips = monthRecords.reduce((sum, r) => sum + r.tips, 0);
    const totalSpecial = monthRecords.reduce((sum, r) => sum + r.specialReward, 0);
    
    if (window.homePieChart) {
        window.homePieChart.destroy();
    }
    
    window.homePieChart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: ['入場料', 'チップ', '特別報酬'],
            datasets: [{
                data: [totalEntrance, totalTips, totalSpecial],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(251, 191, 36, 0.8)',
                    'rgba(236, 72, 153, 0.8)'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 14 },
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ¥${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// カレンダー更新
function updateCalendar() {
    updateMonthDisplays();
    
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();
    
    // 月の最初の日と最後の日
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // カレンダーグリッドを生成
    const gridDiv = document.getElementById('calendarGrid');
    
    let html = '<div class="grid grid-cols-7 gap-2 mb-4">';
    
    // 曜日ヘッダー
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    weekdays.forEach(day => {
        html += `<div class="text-center font-bold text-gray-600">${day}</div>`;
    });
    
    // 月初の空白
    const startDayOfWeek = firstDay.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
        html += '<div></div>';
    }
    
    // 今日の日付
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    // 日付
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const hasData = records.some(r => r.date === dateStr);
        const isToday = dateStr === todayStr;
        
        html += `<div class="calendar-day ${hasData ? 'has-data' : ''} ${isToday ? 'today' : ''}" onclick="showDayDetail('${dateStr}')">${day}</div>`;
    }
    
    html += '</div>';
    gridDiv.innerHTML = html;
}

// 日付詳細表示
function showDayDetail(date) {
    const dayRecords = records.filter(r => r.date === date);
    const detailDiv = document.getElementById('dayDetail');
    const contentDiv = document.getElementById('dayDetailContent');
    
    if (dayRecords.length === 0) {
        detailDiv.classList.add('hidden');
        return;
    }
    
    detailDiv.classList.remove('hidden');
    
    const record = dayRecords[0];
    contentDiv.innerHTML = `
        <div class="mb-3">
            <div class="text-gray-600 text-sm">日付</div>
            <div class="text-lg font-bold">${record.date} (${record.weekday})</div>
        </div>
        <div class="grid grid-cols-2 gap-3">
            <div>
                <div class="text-gray-600 text-sm">総売上</div>
                <div class="text-xl font-bold text-indigo-600">¥${record.totalSales.toLocaleString()}</div>
            </div>
            <div>
                <div class="text-gray-600 text-sm">時給</div>
                <div class="text-xl font-bold text-indigo-600">¥${record.hourlyWage.toLocaleString()}</div>
            </div>
            <div>
                <div class="text-gray-600 text-sm">稼働時間</div>
                <div class="text-lg font-semibold">${record.workingHours.toFixed(1)}時間</div>
            </div>
            <div>
                <div class="text-gray-600 text-sm">総客数</div>
                <div class="text-lg font-semibold">${record.totalCustomers}人</div>
            </div>
            <div>
                <div class="text-gray-600 text-sm">体調</div>
                <div class="text-lg">${'★'.repeat(record.health)}${'☆'.repeat(5-record.health)}</div>
            </div>
            <div>
                <div class="text-gray-600 text-sm">モチベ</div>
                <div class="text-lg">${'★'.repeat(record.motivation)}${'☆'.repeat(5-record.motivation)}</div>
            </div>
        </div>
        ${record.hasEvent ? '<div class="mt-3 text-sm text-purple-600 font-semibold">🎉 イベント開催日</div>' : ''}
        ${record.successMemo ? `<div class="mt-3"><div class="text-gray-600 text-sm">成功メモ</div><div class="text-sm">${record.successMemo}</div></div>` : ''}
    `;
}

// グラフ更新
function updateCharts() {
    updateMonthDisplays();
    updateSalesBreakdownChart();
    updateDailySalesChart();
    updateCustomerFunnelChart();
    updateWeekdayChart();
}

// 売上内訳円グラフ
function updateSalesBreakdownChart() {
    const canvas = document.getElementById('salesBreakdownChart');
    if (!canvas) return;
    
    const monthRecords = getRecordsForMonth(currentStatsMonth);
    const totalEntrance = monthRecords.reduce((sum, r) => sum + r.entranceFee, 0);
    const totalTips = monthRecords.reduce((sum, r) => sum + r.tips, 0);
    const totalSpecial = monthRecords.reduce((sum, r) => sum + r.specialReward, 0);
    
    if (window.salesChart) {
        window.salesChart.destroy();
    }
    
    window.salesChart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: ['入場料', 'チップ', '特別報酬'],
            datasets: [{
                data: [totalEntrance, totalTips, totalSpecial],
                backgroundColor: [
                    'rgba(99, 102, 241, 0.8)',
                    'rgba(251, 191, 36, 0.8)',
                    'rgba(236, 72, 153, 0.8)'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 14 },
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ¥${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// 日別売上推移グラフ
function updateDailySalesChart() {
    const canvas = document.getElementById('dailySalesChart');
    if (!canvas) return;
    
    const monthRecords = getRecordsForMonth(currentStatsMonth);
    const sortedRecords = [...monthRecords].sort((a, b) => a.date.localeCompare(b.date));
    const dates = sortedRecords.map(r => r.date.split('-')[2] + '日');
    const sales = sortedRecords.map(r => r.totalSales);
    
    if (window.dailyChart) {
        window.dailyChart.destroy();
    }
    
    window.dailyChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: '売上（円）',
                data: sales,
                borderColor: 'rgba(99, 102, 241, 1)',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                tension: 0.4,
                fill: true,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '¥' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// 客ファネル円グラフ
function updateCustomerFunnelChart() {
    const canvas = document.getElementById('customerFunnelChart');
    if (!canvas) return;
    
    const monthRecords = getRecordsForMonth(currentStatsMonth);
    
    if (monthRecords.length === 0) {
        if (window.funnelChart) {
            window.funnelChart.destroy();
        }
        return;
    }
    
    const avgTotal = monthRecords.reduce((sum, r) => sum + r.totalCustomers, 0) / monthRecords.length;
    const avgCoin = monthRecords.reduce((sum, r) => sum + r.coinUsers, 0) / monthRecords.length;
    const avgPaid = monthRecords.reduce((sum, r) => sum + r.paidUsers, 0) / monthRecords.length;
    
    if (window.funnelChart) {
        window.funnelChart.destroy();
    }
    
    window.funnelChart = new Chart(canvas, {
        type: 'pie',
        data: {
            labels: ['総客数', 'コインあり', '有料移行'],
            datasets: [{
                data: [avgTotal, avgCoin, avgPaid],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(251, 191, 36, 0.8)',
                    'rgba(34, 197, 94, 0.8)'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: { size: 14 },
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed.toFixed(1);
                            return `${label}: ${value}人`;
                        }
                    }
                }
            }
        }
    });
}

// 曜日別平均時給グラフ
function updateWeekdayChart() {
    const canvas = document.getElementById('weekdayChart');
    if (!canvas) return;
    
    const monthRecords = getRecordsForMonth(currentStatsMonth);
    const weekdays = ['月', '火', '水', '木', '金', '土', '日'];
    const weekdayData = weekdays.map(day => {
        const dayRecords = monthRecords.filter(r => r.weekday === day);
        if (dayRecords.length === 0) return 0;
        return dayRecords.reduce((sum, r) => sum + r.hourlyWage, 0) / dayRecords.length;
    });
    
    if (window.weekdayChartObj) {
        window.weekdayChartObj.destroy();
    }
    
    window.weekdayChartObj = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: weekdays,
            datasets: [{
                label: '平均時給（円）',
                data: weekdayData,
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderColor: 'rgba(99, 102, 241, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '¥' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Service Worker登録（PWA対応）
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker registration failed'));
    });
}
// ========================================
// バックアップ・復元機能
// ========================================

// JSONファイルとしてダウンロード
function exportToJSON() {
    const data = {
        version: '2.1.0',
        exportDate: new Date().toISOString(),
        records: records,
        goals: goals
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `streaming-records-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert('✅ バックアップファイルをダウンロードしました');
}

// CSVファイルとしてエクスポート
function exportToCSV() {
    if (records.length === 0) {
        alert('⚠️ エクスポートするデータがありません');
        return;
    }
    
    // CSVヘッダー
    const headers = [
        '日付', '開始時刻', '終了時刻', 'デバイス', '体調', 'モチベ',
        '総客数', 'コインあり', '常連客', '有料移行', '高単価客',
        '総売上', '入場料', 'チップ', '特別報酬',
        'トークテーマ', '営業導線', 'テンション', '成功メモ', '失敗メモ',
        'イベント', '給料日前後',
        '稼働時間', '時給', '有料移行率', 'コインあり率', '常連率', '高単価客率', 'チップ比率',
        '曜日', '時間帯'
    ];
    
    let csv = headers.join(',') + '\n';
    
    records.forEach(r => {
        const row = [
            r.date, r.startTime, r.endTime, r.device, r.health, r.motivation,
            r.totalCustomers, r.coinUsers, r.regularCustomers, r.paidUsers, r.highSpenders,
            r.totalSales, r.entranceFee, r.tips, r.specialReward,
            `"${r.talkTheme || ''}"`, r.salesApproach, r.tension,
            `"${r.successMemo || ''}"`, `"${r.failureMemo || ''}"`,
            r.hasEvent ? 'あり' : 'なし', r.payday,
            r.workingHours.toFixed(2), r.hourlyWage,
            (r.paidConversionRate * 100).toFixed(1), (r.coinUserRate * 100).toFixed(1),
            (r.regularRate * 100).toFixed(1), (r.highSpenderRate * 100).toFixed(1),
            (r.tipRate * 100).toFixed(1),
            r.weekday, r.timeCategory
        ];
        csv += row.join(',') + '\n';
    });
    
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `streaming-records-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert('✅ CSVファイルをダウンロードしました');
}

// Googleスプレッドシート用のデータ生成
function generateSheetsData() {
    if (records.length === 0) {
        alert('⚠️ エクスポートするデータがありません');
        return;
    }
    
    // スプレッドシート用のフォーマット
    const headers = [
        '日付', '開始時刻', '終了時刻', 'デバイス', '体調', 'モチベ',
        '総客数', 'コインあり', '常連客', '有料移行', '高単価客',
        '総売上', '入場料', 'チップ', '特別報酬',
        'トークテーマ', '営業導線', 'テンション', '成功メモ', '失敗メモ',
        'イベント', '給料日前後',
        '稼働時間', '時給', '有料移行率(%)', 'コインあり率(%)', '常連率(%)', '高単価客率(%)', 'チップ比率(%)',
        '曜日', '時間帯'
    ];
    
    let text = headers.join('\t') + '\n';
    
    records.forEach(r => {
        const row = [
            r.date, r.startTime, r.endTime, r.device, r.health, r.motivation,
            r.totalCustomers, r.coinUsers, r.regularCustomers, r.paidUsers, r.highSpenders,
            r.totalSales, r.entranceFee, r.tips, r.specialReward,
            r.talkTheme || '', r.salesApproach, r.tension,
            r.successMemo || '', r.failureMemo || '',
            r.hasEvent ? 'あり' : 'なし', r.payday,
            r.workingHours.toFixed(2), r.hourlyWage,
            (r.paidConversionRate * 100).toFixed(1), (r.coinUserRate * 100).toFixed(1),
            (r.regularRate * 100).toFixed(1), (r.highSpenderRate * 100).toFixed(1),
            (r.tipRate * 100).toFixed(1),
            r.weekday, r.timeCategory
        ];
        text += row.join('\t') + '\n';
    });
    
    // クリップボードにコピー
    navigator.clipboard.writeText(text).then(() => {
        showModal('Googleスプレッドシートへのコピー', 
            `<div style="text-align: left;">
                <p>✅ データをクリップボードにコピーしました！</p>
                <h3 style="color: #6366f1;">次の手順：</h3>
                <ol style="line-height: 1.8;">
                    <li><strong>Googleスプレッドシートを開く</strong><br>
                    <a href="https://sheets.google.com" target="_blank" style="color: #6366f1;">https://sheets.google.com</a></li>
                    <li><strong>新しいスプレッドシートを作成</strong></li>
                    <li><strong>A1セルを選択</strong></li>
                    <li><strong>貼り付け</strong>（Ctrl+V または Cmd+V）</li>
                    <li><strong>完了！</strong> データが自動的に各列に配置されます</li>
                </ol>
                <p style="background: #fef3c7; padding: 10px; border-radius: 5px; margin-top: 15px;">
                    💡 <strong>ヒント:</strong> スプレッドシートに貼り付けた後、<br>
                    データ → ピボットテーブルで高度な分析も可能です！
                </p>
            </div>`
        );
    }).catch(err => {
        alert('⚠️ クリップボードへのコピーに失敗しました。CSVエクスポートをお試しください。');
    });
}

// JSONファイルからインポート
function importFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // データの検証
            if (!data.records || !Array.isArray(data.records)) {
                alert('⚠️ 無効なバックアップファイルです');
                return;
            }
            
            // 確認ダイアログ
            const confirmMsg = `インポートすると現在のデータ（${records.length}件）が上書きされます。\n\nインポートするデータ: ${data.records.length}件\n目標データ: ${data.goals ? data.goals.length : 0}件\n\n続行しますか？`;
            
            if (confirm(confirmMsg)) {
                records = data.records;
                goals = data.goals || [];
                saveData();
                saveGoals();
                updateDashboard();
                updateCalendar();
                alert(`✅ インポート完了！\n記録: ${records.length}件\n目標: ${goals.length}件`);
            }
        } catch (error) {
            alert('⚠️ ファイルの読み込みに失敗しました: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// モーダル表示関数
function showModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <h2 style="color: #6366f1; margin-top: 0;">${title}</h2>
            ${content}
            <button onclick="this.closest('.modal').remove()" class="btn-primary" style="margin-top: 20px;">
                閉じる
            </button>
        </div>
    `;
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    };
    document.body.appendChild(modal);
}

// データ統計を表示
function showDataStats() {
    const totalRecords = records.length;
    const totalGoals = goals.length;
    const oldestDate = records.length > 0 ? records.reduce((min, r) => r.date < min ? r.date : min, records[0].date) : '-';
    const newestDate = records.length > 0 ? records.reduce((max, r) => r.date > max ? r.date : max, records[0].date) : '-';
    const totalSales = records.reduce((sum, r) => sum + r.totalSales, 0);
    const totalSessions = records.length;
    const avgHourly = totalSessions > 0 ? Math.round(records.reduce((sum, r) => sum + r.hourlyWage, 0) / totalSessions) : 0;
    
    showModal('データ統計情報', `
        <div style="text-align: left;">
            <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; margin-bottom: 15px;">
                <h3 style="color: #6366f1; margin-top: 0;">📊 記録データ</h3>
                <p><strong>総記録数:</strong> ${totalRecords}件</p>
                <p><strong>期間:</strong> ${oldestDate} 〜 ${newestDate}</p>
                <p><strong>累計売上:</strong> ¥${totalSales.toLocaleString()}</p>
                <p><strong>平均時給:</strong> ¥${avgHourly.toLocaleString()}</p>
            </div>
            <div style="background: #fef3c7; padding: 15px; border-radius: 10px;">
                <h3 style="color: #d97706; margin-top: 0;">🎯 目標データ</h3>
                <p><strong>設定済み目標:</strong> ${totalGoals}件</p>
            </div>
            <div style="background: #e0f2fe; padding: 15px; border-radius: 10px; margin-top: 15px;">
                <h3 style="color: #0369a1; margin-top: 0;">💾 ストレージ情報</h3>
                <p><strong>LocalStorage使用中</strong></p>
                <p style="font-size: 0.9em; color: #6b7280;">
                    ※ ブラウザのキャッシュクリアでデータが消える可能性があります。<br>
                    定期的にバックアップを取ることを推奨します。
                </p>
            </div>
        </div>
    `);
}

// ========================================
// v2.2 同期機能の初期化
// ========================================

// ページ読み込み時に同期設定をロード
document.addEventListener('DOMContentLoaded', function() {
    // 同期設定セクションにHTMLを挿入
    fetch('sync-settings.html')
        .then(response => response.text())
        .then(html => {
            const section = document.getElementById('sync-settings-section');
            if (section) {
                section.innerHTML = html;
                loadSyncSettings();
            }
        })
        .catch(err => console.log('Sync settings not loaded:', err));
});

// 既存のsaveData関数を拡張して自動同期を追加
const originalSaveData = window.saveData;
window.saveData = function() {
    if (originalSaveData) {
        originalSaveData();
    } else {
        // オリジナルの保存処理
        localStorage.setItem('streamingRecords', JSON.stringify(streamingRecords));
    }
    
    // 自動同期を実行
    autoSyncIfEnabled();
};

// 既存のsaveGoals関数を拡張して自動同期を追加
const originalSaveGoals = window.saveGoals;
window.saveGoals = function() {
    if (originalSaveGoals) {
        originalSaveGoals();
    } else {
        // オリジナルの保存処理
        localStorage.setItem('streamingGoals', JSON.stringify(streamingGoals));
    }
    
    // 自動同期を実行
    autoSyncIfEnabled();
};

console.log('✅ v2.2 自動同期機能が有効化されました');
