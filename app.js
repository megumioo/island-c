class LifeManagerApp {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.currentSection = 'records';
        this.acVersion = '小航小刀小岛';
        this.acNpcs = {
            '小航小刀小岛': ['威亚', '丽婷', '茉莉', '樱桃', '贾洛斯', '大姐头', '草莓', '杰西卡', '哈姆', '小影'],
            '刀刀航航岛岛': ['胜利', '雷姆', '娃娃', '茉莉', '凯恩', '小偲', '李彻', '朱禄', '冰冰', '蜜拉']
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadCurrentDate();
        this.loadTempData();
        this.loadCheckinData();
        this.setupAutoArchive();
        this.generateCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
        this.loadImportantDates();
        this.renderAcNpcs();
        this.updateChoresScore();
        this.refreshAnalytics();
        this.initOverviewPanel(); // 初始化今日概览面板
    }
    
    setupEventListeners() {
        // 导航切换
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(e.target.getAttribute('href').substring(1));
            });
        });
        
        // 移动端导航
        document.querySelectorAll('.bottom-nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchSection(e.target.getAttribute('href').substring(1));
            });
        });
        
        // 汉堡菜单
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('show');
        });
        
        // 模块折叠
        document.querySelectorAll('.module-header').forEach(header => {
            header.addEventListener('click', () => {
                const card = header.parentElement;
                card.classList.toggle('collapsed');
                const btn = header.querySelector('.collapse-btn i');
                btn.style.transform = card.classList.contains('collapsed') ? 'rotate(180deg)' : 'rotate(0)';
            });
        });
        
        // 暂时保存按钮
        document.querySelectorAll('.temp-save').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.saveModuleData(e.target.closest('.module-card'));
                this.showNotification('数据已暂时保存', 'success');
                this.updateOverviewData(); // 保存时更新概览数据
            });
        });
        
        // 动态添加行
        document.querySelector('.add-row-btn')?.addEventListener('click', () => this.addWorkRow());
        document.querySelector('.add-study-btn')?.addEventListener('click', () => this.addStudyRow());
        document.querySelector('.add-exercise-btn')?.addEventListener('click', () => this.addExerciseRow());
        document.querySelector('.add-entertainment-btn')?.addEventListener('click', () => this.addEntertainmentRow());
        document.querySelector('.add-income-btn')?.addEventListener('click', () => this.addIncomeRow());
        document.querySelector('.add-expense-btn')?.addEventListener('click', () => this.addExpenseRow());
        document.querySelector('.add-game-btn')?.addEventListener('click', () => this.addGameRow()); // 新增游戏添加按钮
        
        // 删除行
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-row-btn') || 
                e.target.closest('.remove-row-btn')) {
                const btn = e.target.classList.contains('remove-row-btn') ? e.target : e.target.closest('.remove-row-btn');
                const row = btn.closest('.form-row');
                if (row && row.parentElement.classList.contains('work-entries')) {
                    if (document.querySelectorAll('.work-entries .form-row').length > 1) {
                        row.remove();
                    }
                } else if (row) {
                    row.remove();
                    // 检查是否需要添加默认行
                    const container = row.parentElement;
                    if (container.children.length === 0) {
                        const moduleType = container.closest('.module-card').dataset.module;
                        this.addDefaultRow(moduleType);
                    }
                }
                this.updateOverviewData(); // 删除时更新概览数据
            }
        });
        
        // 家务记录计分
        document.querySelectorAll('.chore-item').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateChoresScore();
                this.updateOverviewData(); // 更新概览数据
            });
        });
        
        // 打卡保存
        document.getElementById('saveCheckinBtn')?.addEventListener('click', () => {
            this.saveCheckinData();
            this.updateOverviewData(); // 更新概览数据
        });
        
        // 动森版本切换
        document.querySelectorAll('input[name="ac-version"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.acVersion = e.target.value;
                this.renderAcNpcs();
                this.loadCheckinData();
            });
        });
        
        // 日历控制
        document.getElementById('prevMonth')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth')?.addEventListener('click', () => this.changeMonth(1));
        
        // 重要日期表单
        document.getElementById('importantDateForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addImportantDate();
        });
        
        // 数据复盘刷新
        document.getElementById('refreshAnalytics')?.addEventListener('click', () => this.refreshAnalytics());
        
        // 云同步
        document.getElementById('testConnection')?.addEventListener('click', () => this.testGitHubConnection());
        document.getElementById('backupData')?.addEventListener('click', () => this.backupToGitHub());
        document.getElementById('restoreData')?.addEventListener('click', () => this.restoreFromGitHub());
        document.getElementById('exportData')?.addEventListener('click', () => this.exportData());
        document.getElementById('importData')?.addEventListener('click', () => this.importData());
        document.getElementById('clearLocalData')?.addEventListener('click', () => this.clearLocalData());
        
        // 日期点击
        document.addEventListener('click', (e) => {
            if (e.target.closest('.calendar-day') && !e.target.closest('.calendar-day.empty')) {
                const dayElement = e.target.closest('.calendar-day');
                const day = parseInt(dayElement.querySelector('.calendar-day-number').textContent);
                const year = this.currentDate.getFullYear();
                const month = this.currentDate.getMonth();
                this.selectedDate = new Date(year, month, day);
                this.showDateDetails(this.selectedDate);
            }
        });
        
        // 初始加载后，如果有work-entries是空的，添加一行
        const workEntries = document.querySelector('.work-entries');
        if (workEntries && workEntries.children.length === 0) {
            this.addWorkRow();
        }
    }
    
    // 初始化今日概览面板
    initOverviewPanel() {
        // 创建概览面板HTML结构
        const overviewHTML = `
            <div class="overview-panel" id="overviewPanel">
                <div class="overview-header">
                    <h3><i class="fas fa-calendar-day"></i> 今日概览</h3>
                    <button class="overview-close" id="overviewClose">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="overview-date" id="overviewCurrentDate"></div>
                <div class="overview-content" id="overviewContent">
                    <div class="overview-loading">
                        <i class="fas fa-spinner fa-spin"></i> 加载中...
                    </div>
                </div>
            </div>
            <button class="overview-toggle-btn" id="overviewToggleBtn">
                <i class="fas fa-chart-pie"></i>
            </button>
        `;
        
        // 添加到body
        document.body.insertAdjacentHTML('beforeend', overviewHTML);
        
        // 设置今日日期
        const now = new Date();
        const formattedDate = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
        document.getElementById('overviewCurrentDate').textContent = formattedDate;
        
        // 绑定事件
        document.getElementById('overviewToggleBtn').addEventListener('click', () => this.toggleOverviewPanel());
        document.getElementById('overviewClose').addEventListener('click', () => this.hideOverviewPanel());
        
        // 点击面板外部关闭
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('overviewPanel');
            const toggleBtn = document.getElementById('overviewToggleBtn');
            if (panel && panel.classList.contains('show') && 
                !panel.contains(e.target) && 
                !toggleBtn.contains(e.target)) {
                this.hideOverviewPanel();
            }
        });
        
        // 初始加载概览数据
        this.updateOverviewData();
    }
    
    // 切换概览面板显示/隐藏
    toggleOverviewPanel() {
        const panel = document.getElementById('overviewPanel');
        panel.classList.toggle('show');
        if (panel.classList.contains('show')) {
            this.updateOverviewData();
        }
    }
    
    // 隐藏概览面板
    hideOverviewPanel() {
        const panel = document.getElementById('overviewPanel');
        panel.classList.remove('show');
    }
    
    // 更新概览数据
    updateOverviewData() {
        const content = document.getElementById('overviewContent');
        const dateKey = this.getDateKey();
        
        // 获取各模块今日数据
        const data = {
            work: { tasks: [], completed: 0, total: 0 },
            chores: { score: 0, total: 10 },
            finance: { incomeCount: 0, expenseCount: 0, incomeTotal: 0, expenseTotal: 0 }
        };
        
        // 工作数据
        const workData = localStorage.getItem(`work_TEMP_${dateKey}`);
        if (workData) {
            const workEntries = JSON.parse(workData);
            if (Array.isArray(workEntries)) {
                data.work.total = workEntries.length;
                data.work.completed = workEntries.filter(entry => entry.done && entry.done.trim() !== '').length;
            }
        }
        
        // 家务数据
        const choresData = localStorage.getItem(`chores_TEMP_${dateKey}`);
        if (choresData) {
            const chores = JSON.parse(choresData);
            if (Array.isArray(chores)) {
                data.chores.score = chores.length;
            }
        }
        
        // 财务数据
        const financeData = localStorage.getItem(`finance_TEMP_${dateKey}`);
        if (financeData) {
            const finance = JSON.parse(financeData);
            if (finance.income && Array.isArray(finance.income)) {
                data.finance.incomeCount = finance.income.length;
                data.finance.incomeTotal = finance.income.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
            }
            if (finance.expense && Array.isArray(finance.expense)) {
                data.finance.expenseCount = finance.expense.length;
                data.finance.expenseTotal = finance.expense.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
            }
        }
        
        // 生成HTML
        let html = `
            <div class="overview-section">
                <h4><i class="fas fa-tasks"></i> 工作看板</h4>
                <div class="overview-item">
                    <span>完成任务:</span>
                    <strong class="${data.work.completed === data.work.total && data.work.total > 0 ? 'text-success' : ''}">
                        ${data.work.completed} / ${data.work.total}
                    </strong>
                </div>
                ${data.work.total === 0 ? '<div class="overview-empty">暂无记录</div>' : ''}
            </div>
            
            <div class="overview-section">
                <h4><i class="fas fa-home"></i> 家务记录</h4>
                <div class="overview-item">
                    <span>家务得分:</span>
                    <strong class="${data.chores.score >= 5 ? 'text-success' : ''}">
                        ${data.chores.score} / ${data.chores.total}
                    </strong>
                </div>
                ${data.chores.score === 0 ? '<div class="overview-empty">暂无记录</div>' : ''}
            </div>
            
            <div class="overview-section">
                <h4><i class="fas fa-wallet"></i> 财务记账</h4>
                <div class="overview-item">
                    <span>收入记录:</span>
                    <strong>${data.finance.incomeCount} 笔</strong>
                </div>
                <div class="overview-item">
                    <span>支出记录:</span>
                    <strong>${data.finance.expenseCount} 笔</strong>
                </div>
                <div class="overview-item">
                    <span>今日结余:</span>
                    <strong class="${(data.finance.incomeTotal - data.finance.expenseTotal) >= 0 ? 'text-success' : 'text-danger'}">
                        ¥${(data.finance.incomeTotal - data.finance.expenseTotal).toFixed(2)}
                    </strong>
                </div>
                ${data.finance.incomeCount === 0 && data.finance.expenseCount === 0 ? '<div class="overview-empty">暂无记录</div>' : ''}
            </div>
        `;
        
        content.innerHTML = html;
    }
    
    switchSection(sectionId) {
        // 更新导航激活状态
        document.querySelectorAll('.nav-link, .bottom-nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
                link.classList.add('active');
            }
        });
        
        // 切换内容区域
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionId).classList.add('active');
        
        // 关闭移动端侧边栏
        document.querySelector('.sidebar').classList.remove('show');
        
        this.currentSection = sectionId;
        
        // 如果切换到复盘页面，刷新数据
        if (sectionId === 'analytics') {
            setTimeout(() => this.refreshAnalytics(), 100);
        }
    }
    
    loadCurrentDate() {
        const now = new Date();
        const formattedDate = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
        document.getElementById('currentDate').textContent = formattedDate;
    }
    
    getDateKey(date = new Date()) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    
    saveModuleData(card) {
        const moduleName = card.dataset.module;
        const dateKey = this.getDateKey();
        const storageKey = `${moduleName}_TEMP_${dateKey}`;
        
        let data = {};
        
        switch(moduleName) {
            case 'sleep':
                data = {
                    duration: card.querySelector('.sleep-duration').value,
                    quality: card.querySelector('.sleep-quality').value,
                    feeling: card.querySelector('.sleep-feeling').value
                };
                break;
                
            case 'breakfast':
                data = {
                    content: card.querySelector('.breakfast-content').value,
                    feeling: card.querySelector('.breakfast-feeling').value
                };
                break;
                
            case 'work':
                const workEntries = [];
                card.querySelectorAll('.work-entries .form-row').forEach(row => {
                    workEntries.push({
                        todo: row.querySelector('.work-todo').value,
                        done: row.querySelector('.work-done').value
                    });
                });
                data = workEntries;
                break;
                
            case 'chores':
                const chores = [];
                card.querySelectorAll('.chore-item:checked').forEach(checkbox => {
                    chores.push(checkbox.value);
                });
                data = chores;
                break;
                
            case 'study':
                const studyEntries = [];
                card.querySelectorAll('.study-entries .form-row').forEach(row => {
                    const rowContainer = row.closest('.game-entry-item') || row;
                    studyEntries.push({
                        subject: rowContainer.querySelector('.study-subject').value,
                        duration: rowContainer.querySelector('.study-duration').value,
                        content: rowContainer.querySelector('.study-content').value,
                        summary: rowContainer.querySelector('.study-summary').value
                    });
                });
                data = studyEntries;
                break;
                
            case 'lunch':
                data = {
                    content: card.querySelector('.lunch-content').value,
                    feeling: card.querySelector('.lunch-feeling').value
                };
                break;
                
            case 'nap':
                data = {
                    duration: card.querySelector('.nap-duration').value,
                    quality: card.querySelector('.nap-quality').value,
                    feeling: card.querySelector('.nap-feeling').value
                };
                break;
                
            case 'dinner':
                data = {
                    content: card.querySelector('.dinner-content').value,
                    feeling: card.querySelector('.dinner-feeling').value
                };
                break;
                
            case 'exercise':
                const exerciseEntries = [];
                card.querySelectorAll('.exercise-entries .form-row').forEach(row => {
                    const rowContainer = row.closest('.game-entry-item') || row;
                    exerciseEntries.push({
                        type: rowContainer.querySelector('.exercise-type').value,
                        duration: rowContainer.querySelector('.exercise-duration').value,
                        calories: rowContainer.querySelector('.exercise-calories').value,
                        feeling: rowContainer.querySelector('.exercise-feeling').value
                    });
                });
                data = exerciseEntries;
                break;
                
            case 'game':
                const gameEntries = [];
                card.querySelectorAll('.game-entry-item').forEach(item => {
                    gameEntries.push({
                        name: item.querySelector('.game-name').value,
                        duration: item.querySelector('.game-duration').value,
                        feeling: item.querySelector('.game-feeling').value
                    });
                });
                data = gameEntries;
                break;
                
            case 'entertainment':
                const entertainmentEntries = [];
                card.querySelectorAll('.entertainment-entries .form-row').forEach(row => {
                    const rowContainer = row.closest('.game-entry-item') || row;
                    entertainmentEntries.push({
                        type: rowContainer.querySelector('.entertainment-type').value,
                        duration: rowContainer.querySelector('.entertainment-duration').value,
                        feeling: rowContainer.querySelector('.entertainment-feeling').value
                    });
                });
                data = entertainmentEntries;
                break;
                
            case 'finance':
                const incomeEntries = [];
                const expenseEntries = [];
                
                card.querySelectorAll('.income-entries .form-row').forEach(row => {
                    incomeEntries.push({
                        category: row.querySelector('.income-category').value,
                        amount: row.querySelector('.income-amount').value,
                        description: row.querySelector('.income-description').value
                    });
                });
                
                card.querySelectorAll('.expense-entries .form-row').forEach(row => {
                    expenseEntries.push({
                        category: row.querySelector('.expense-category').value,
                        amount: row.querySelector('.expense-amount').value,
                        description: row.querySelector('.expense-description').value
                    });
                });
                
                data = { income: incomeEntries, expense: expenseEntries };
                break;
        }
        
        localStorage.setItem(storageKey, JSON.stringify(data));
    }
    
    loadTempData() {
        const dateKey = this.getDateKey();
        
        document.querySelectorAll('.module-card').forEach(card => {
            const moduleName = card.dataset.module;
            const storageKey = `${moduleName}_TEMP_${dateKey}`;
            const data = localStorage.getItem(storageKey);
            
            if (!data) {
                // 如果没有数据，为需要多行输入的模块添加默认行
                if (moduleName === 'work' && !card.querySelector('.work-entries .form-row')) {
                    this.addWorkRow();
                }
                if (moduleName === 'game' && !card.querySelector('.game-entry-item')) {
                    this.addGameRow();
                }
                return;
            }
            
            const parsedData = JSON.parse(data);
            
            switch(moduleName) {
                case 'sleep':
                    card.querySelector('.sleep-duration').value = parsedData.duration || '';
                    card.querySelector('.sleep-quality').value = parsedData.quality || '';
                    card.querySelector('.sleep-feeling').value = parsedData.feeling || '';
                    break;
                    
                case 'breakfast':
                    card.querySelector('.breakfast-content').value = parsedData.content || '';
                    card.querySelector('.breakfast-feeling').value = parsedData.feeling || '';
                    break;
                    
                case 'work':
                    const workContainer = card.querySelector('.work-entries');
                    workContainer.innerHTML = '';
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                        parsedData.forEach(entry => {
                            this.addWorkRow(entry.todo, entry.done);
                        });
                    } else {
                        this.addWorkRow();
                    }
                    break;
                    
                case 'chores':
                    if (Array.isArray(parsedData)) {
                        card.querySelectorAll('.chore-item').forEach(checkbox => {
                            checkbox.checked = parsedData.includes(checkbox.value);
                        });
                        this.updateChoresScore();
                    }
                    break;
                    
                case 'study':
                    const studyContainer = card.querySelector('.study-entries');
                    studyContainer.innerHTML = '';
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                        parsedData.forEach(entry => {
                            this.addStudyRow(entry.subject, entry.duration, entry.content, entry.summary);
                        });
                    } else {
                        this.addStudyRow();
                    }
                    break;
                    
                case 'lunch':
                    card.querySelector('.lunch-content').value = parsedData.content || '';
                    card.querySelector('.lunch-feeling').value = parsedData.feeling || '';
                    break;
                    
                case 'nap':
                    card.querySelector('.nap-duration').value = parsedData.duration || '';
                    card.querySelector('.nap-quality').value = parsedData.quality || '';
                    card.querySelector('.nap-feeling').value = parsedData.feeling || '';
                    break;
                    
                case 'dinner':
                    card.querySelector('.dinner-content').value = parsedData.content || '';
                    card.querySelector('.dinner-feeling').value = parsedData.feeling || '';
                    break;
                    
                case 'exercise':
                    const exerciseContainer = card.querySelector('.exercise-entries');
                    exerciseContainer.innerHTML = '';
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                        parsedData.forEach(entry => {
                            this.addExerciseRow(entry.type, entry.duration, entry.calories, entry.feeling);
                        });
                    } else {
                        this.addExerciseRow();
                    }
                    break;
                    
                case 'game':
                    const gameContainer = card.querySelector('.game-entries');
                    gameContainer.innerHTML = '';
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                        parsedData.forEach(entry => {
                            this.addGameRow(entry.name, entry.duration, entry.feeling);
                        });
                    } else {
                        // 兼容旧版单条数据格式
                        if (parsedData.name || parsedData.duration || parsedData.feeling) {
                            this.addGameRow(parsedData.name, parsedData.duration, parsedData.feeling);
                        } else {
                            this.addGameRow();
                        }
                    }
                    break;
                    
                case 'entertainment':
                    const entertainmentContainer = card.querySelector('.entertainment-entries');
                    entertainmentContainer.innerHTML = '';
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                        parsedData.forEach(entry => {
                            this.addEntertainmentRow(entry.type, entry.duration, entry.feeling);
                        });
                    } else {
                        this.addEntertainmentRow();
                    }
                    break;
                    
                case 'finance':
                    if (parsedData.income && Array.isArray(parsedData.income)) {
                        const incomeContainer = card.querySelector('.income-entries');
                        incomeContainer.innerHTML = '';
                        if (parsedData.income.length > 0) {
                            parsedData.income.forEach(entry => {
                                this.addIncomeRow(entry.category, entry.amount, entry.description);
                            });
                        } else {
                            this.addIncomeRow();
                        }
                    }
                    
                    if (parsedData.expense && Array.isArray(parsedData.expense)) {
                        const expenseContainer = card.querySelector('.expense-entries');
                        expenseContainer.innerHTML = '';
                        if (parsedData.expense.length > 0) {
                            parsedData.expense.forEach(entry => {
                                this.addExpenseRow(entry.category, entry.amount, entry.description);
                            });
                        } else {
                            this.addExpenseRow();
                        }
                    }
                    break;
            }
        });
    }
    
    addWorkRow(todo = '', done = '') {
        const container = document.querySelector('.work-entries');
        const row = document.createElement('div');
        row.className = 'form-row align-center';
        row.innerHTML = `
            <div class="form-group flex-1">
                <input type="text" class="form-control work-todo" placeholder="待办事项" value="${todo}">
            </div>
            <div class="form-group flex-1">
                <input type="text" class="form-control work-done" placeholder="完成情况" value="${done}">
            </div>
            <button type="button" class="btn btn-remove remove-row-btn"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(row);
    }
    
    addStudyRow(subject = '逻辑', duration = '', content = '', summary = '') {
        const container = document.querySelector('.study-entries');
        
        // 创建行容器
        const rowContainer = document.createElement('div');
        
        // 创建第一行（科目、时长、删除按钮）
        const firstRow = document.createElement('div');
        firstRow.className = 'form-row align-center';
        firstRow.innerHTML = `
            <div class="form-group flex-1">
                <label>科目:</label>
                <select class="form-control study-subject">
                    <option value="逻辑" ${subject === '逻辑' ? 'selected' : ''}>逻辑</option>
                    <option value="数学" ${subject === '数学' ? 'selected' : ''}>数学</option>
                    <option value="英语" ${subject === '英语' ? 'selected' : ''}>英语</option>
                    <option value="写作" ${subject === '写作' ? 'selected' : ''}>写作</option>
                    <option value="其他" ${subject === '其他' ? 'selected' : ''}>其他</option>
                </select>
            </div>
            <div class="form-group flex-1">
                <label>时长 (小时):</label>
                <input type="number" step="0.1" min="0" class="form-control study-duration" placeholder="例如: 2" value="${duration}">
            </div>
            <button type="button" class="btn btn-remove remove-row-btn"><i class="fas fa-times"></i></button>
        `;
        
        // 创建内容文本框
        const contentDiv = document.createElement('div');
        contentDiv.className = 'form-group';
        contentDiv.innerHTML = `
            <label>学习内容:</label>
            <textarea class="form-control study-content" rows="2" placeholder="学习了什么？">${content}</textarea>
        `;
        
        // 创建总结文本框
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'form-group';
        summaryDiv.innerHTML = `
            <label>学习总结:</label>
            <textarea class="form-control study-summary" rows="2" placeholder="有什么收获？">${summary}</textarea>
        `;
        
        // 组装
        rowContainer.appendChild(firstRow);
        rowContainer.appendChild(contentDiv);
        rowContainer.appendChild(summaryDiv);
        container.appendChild(rowContainer);
    }
    
    // 新增游戏记录行
    addGameRow(name = '', duration = '', feeling = '') {
        const container = document.querySelector('.game-entries');
        
        // 创建游戏记录项
        const gameItem = document.createElement('div');
        gameItem.className = 'game-entry-item';
        gameItem.innerHTML = `
            <div class="form-row align-center">
                <div class="form-group flex-1">
                    <label>游戏名称:</label>
                    <input type="text" class="form-control game-name" placeholder="玩的是什么游戏？" value="${name}">
                </div>
                <div class="form-group flex-1">
                    <label>游戏时长 (小时):</label>
                    <input type="number" step="0.1" min="0" class="form-control game-duration" placeholder="例如: 2" value="${duration}">
                </div>
                <button type="button" class="btn btn-remove remove-row-btn"><i class="fas fa-times"></i></button>
            </div>
            <div class="form-group">
                <label>游戏感受:</label>
                <textarea class="form-control game-feeling" rows="2" placeholder="玩得开心吗？">${feeling}</textarea>
            </div>
        `;
        container.appendChild(gameItem);
    }
    
    addExerciseRow(type = '有氧', duration = '', calories = '', feeling = '') {
        const container = document.querySelector('.exercise-entries');
        
        // 创建行容器
        const rowContainer = document.createElement('div');
        
        // 创建第一行（类型、时长、热量、删除按钮）
        const firstRow = document.createElement('div');
        firstRow.className = 'form-row align-center';
        firstRow.innerHTML = `
            <div class="form-group flex-1">
                <label>运动类型:</label>
                <select class="form-control exercise-type">
                    <option value="有氧" ${type === '有氧' ? 'selected' : ''}>有氧</option>
                    <option value="无氧" ${type === '无氧' ? 'selected' : ''}>无氧</option>
                    <option value="力量" ${type === '力量' ? 'selected' : ''}>力量</option>
                    <option value="拉伸" ${type === '拉伸' ? 'selected' : ''}>拉伸</option>
                    <option value="舞力全开" ${type === '舞力全开' ? 'selected' : ''}>舞力全开</option>
                </select>
            </div>
            <div class="form-group flex-1">
                <label>时长 (小时):</label>
                <input type="number" step="0.1" min="0" class="form-control exercise-duration" placeholder="例如: 1" value="${duration}">
            </div>
            <div class="form-group flex-1">
                <label>消耗热量 (千卡):</label>
                <input type="number" min="0" class="form-control exercise-calories" placeholder="例如: 300" value="${calories}">
            </div>
            <button type="button" class="btn btn-remove remove-row-btn"><i class="fas fa-times"></i></button>
        `;
        
        // 创建感受文本框
        const feelingDiv = document.createElement('div');
        feelingDiv.className = 'form-group';
        feelingDiv.innerHTML = `
            <label>运动感受:</label>
            <textarea class="form-control exercise-feeling" rows="2" placeholder="感觉如何？">${feeling}</textarea>
        `;
        
        // 组装
        rowContainer.appendChild(firstRow);
        rowContainer.appendChild(feelingDiv);
        container.appendChild(rowContainer);
    }
    
    addEntertainmentRow(type = '动画', duration = '', feeling = '') {
        const container = document.querySelector('.entertainment-entries');
        
        // 创建行容器
        const rowContainer = document.createElement('div');
        
        // 创建第一行（类型、时长、删除按钮）
        const firstRow = document.createElement('div');
        firstRow.className = 'form-row align-center';
        firstRow.innerHTML = `
            <div class="form-group flex-1">
                <label>娱乐类型:</label>
                <select class="form-control entertainment-type">
                    <option value="动画" ${type === '动画' ? 'selected' : ''}>动画</option>
                    <option value="电影" ${type === '电影' ? 'selected' : ''}>电影</option>
                    <option value="拼豆" ${type === '拼豆' ? 'selected' : ''}>拼豆</option>
                    <option value="美甲" ${type === '美甲' ? 'selected' : ''}>美甲</option>
                    <option value="其他" ${type === '其他' ? 'selected' : ''}>其他</option>
                </select>
            </div>
            <div class="form-group flex-1">
                <label>时长 (小时):</label>
                <input type="number" step="0.1" min="0" class="form-control entertainment-duration" placeholder="例如: 1.5" value="${duration}">
            </div>
            <button type="button" class="btn btn-remove remove-row-btn"><i class="fas fa-times"></i></button>
        `;
        
        // 创建感受文本框
        const feelingDiv = document.createElement('div');
        feelingDiv.className = 'form-group';
        feelingDiv.innerHTML = `
            <label>娱乐感受:</label>
            <textarea class="form-control entertainment-feeling" rows="2" placeholder="感觉如何？">${feeling}</textarea>
        `;
        
        // 组装
        rowContainer.appendChild(firstRow);
        rowContainer.appendChild(feelingDiv);
        container.appendChild(rowContainer);
    }
    
    addIncomeRow(category = '工资', amount = '', description = '') {
        const container = document.querySelector('.income-entries');
        const row = document.createElement('div');
        row.className = 'form-row align-center';
        row.innerHTML = `
            <div class="form-group flex-1">
                <label>分类:</label>
                <select class="form-control income-category">
                    <option value="工资" ${category === '工资' ? 'selected' : ''}>工资</option>
                    <option value="兼职" ${category === '兼职' ? 'selected' : ''}>兼职</option>
                    <option value="礼物" ${category === '礼物' ? 'selected' : ''}>礼物</option>
                    <option value="其他" ${category === '其他' ? 'selected' : ''}>其他</option>
                </select>
            </div>
            <div class="form-group flex-1">
                <label>金额:</label>
                <input type="number" min="0" class="form-control income-amount" placeholder="金额" value="${amount}">
            </div>
            <div class="form-group flex-2">
                <label>描述:</label>
                <input type="text" class="form-control income-description" placeholder="收入描述" value="${description}">
            </div>
            <button type="button" class="btn btn-remove remove-row-btn"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(row);
    }
    
    addExpenseRow(category = '餐饮', amount = '', description = '') {
        const container = document.querySelector('.expense-entries');
        const row = document.createElement('div');
        row.className = 'form-row align-center';
        row.innerHTML = `
            <div class="form-group flex-1">
                <label>分类:</label>
                <select class="form-control expense-category">
                    <option value="餐饮" ${category === '餐饮' ? 'selected' : ''}>餐饮</option>
                    <option value="购物" ${category === '购物' ? 'selected' : ''}>购物</option>
                    <option value="娱乐" ${category === '娱乐' ? 'selected' : ''}>娱乐</option>
                    <option value="交通" ${category === '交通' ? 'selected' : ''}>交通</option>
                    <option value="其他" ${category === '其他' ? 'selected' : ''}>其他</option>
                </select>
            </div>
            <div class="form-group flex-1">
                <label>金额:</label>
                <input type="number" min="0" class="form-control expense-amount" placeholder="金额" value="${amount}">
            </div>
            <div class="form-group flex-2">
                <label>描述:</label>
                <input type="text" class="form-control expense-description" placeholder="支出描述" value="${description}">
            </div>
            <button type="button" class="btn btn-remove remove-row-btn"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(row);
    }
    
    updateChoresScore() {
        const checkedCount = document.querySelectorAll('.chore-item:checked').length;
        document.getElementById('choresTotal').textContent = checkedCount;
    }
    
    saveCheckinData() {
        const dateKey = this.getDateKey();
        const checkinData = {
            supplement: {
                iron: document.querySelector('.supplement-checkbox[data-type="iron"]').checked,
                d3k2: document.querySelector('.supplement-checkbox[data-type="d3k2"]').checked,
                magnesium: document.querySelector('.supplement-checkbox[data-type="magnesium"]').checked
            },
            care: {
                scrub: document.querySelector('.care-checkbox[data-type="scrub"]').checked,
                hairRemoval: document.querySelector('.care-checkbox[data-type="hair-removal"]').checked,
                lotion: document.querySelector('.care-checkbox[data-type="lotion"]').checked
            },
            animalCrossing: {
                version: this.acVersion,
                npcStatus: {}
            }
        };
        
        // 保存动森NPC状态
        document.querySelectorAll('.ac-npc-card').forEach(card => {
            const npcName = card.querySelector('.ac-npc-name').textContent;
            checkinData.animalCrossing.npcStatus[npcName] = {
                greeting: card.querySelector('.greeting-checkbox').checked,
                gift: card.querySelector('.gift-checkbox').checked
            };
        });
        
        localStorage.setItem(`checkin_${dateKey}`, JSON.stringify(checkinData));
        this.showNotification('打卡数据已保存', 'success');
    }
    
    loadCheckinData() {
        const dateKey = this.getDateKey();
        const checkinData = localStorage.getItem(`checkin_${dateKey}`);
        
        if (!checkinData) return;
        
        const parsedData = JSON.parse(checkinData);
        
        // 加载补剂打卡
        if (parsedData.supplement) {
            document.querySelector('.supplement-checkbox[data-type="iron"]').checked = parsedData.supplement.iron || false;
            document.querySelector('.supplement-checkbox[data-type="d3k2"]').checked = parsedData.supplement.d3k2 || false;
            document.querySelector('.supplement-checkbox[data-type="magnesium"]').checked = parsedData.supplement.magnesium || false;
        }
        
        // 加载护理打卡
        if (parsedData.care) {
            document.querySelector('.care-checkbox[data-type="scrub"]').checked = parsedData.care.scrub || false;
            document.querySelector('.care-checkbox[data-type="hair-removal"]').checked = parsedData.care.hairRemoval || false;
            document.querySelector('.care-checkbox[data-type="lotion"]').checked = parsedData.care.lotion || false;
        }
        
        // 加载动森打卡
        if (parsedData.animalCrossing && parsedData.animalCrossing.version === this.acVersion) {
            const npcStatus = parsedData.animalCrossing.npcStatus;
            document.querySelectorAll('.ac-npc-card').forEach(card => {
                const npcName = card.querySelector('.ac-npc-name').textContent;
                if (npcStatus[npcName]) {
                    card.querySelector('.greeting-checkbox').checked = npcStatus[npcName].greeting || false;
                    card.querySelector('.gift-checkbox').checked = npcStatus[npcName].gift || false;
                }
            });
        }
    }
    
    renderAcNpcs() {
        const container = document.getElementById('acNpcGrid');
        container.innerHTML = '';
        
        this.acNpcs[this.acVersion].forEach(npc => {
            const card = document.createElement('div');
            card.className = 'ac-npc-card';
            card.innerHTML = `
                <div class="ac-npc-name">${npc}</div>
                <div class="ac-npc-checkboxes">
                    <div class="ac-npc-checkbox">
                        <label>打招呼</label>
                        <input type="checkbox" class="greeting-checkbox">
                    </div>
                    <div class="ac-npc-checkbox">
                        <label>送礼物</label>
                        <input type="checkbox" class="gift-checkbox">
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }
    
    setupAutoArchive() {
        const now = new Date();
        const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
        const timeUntilMidnight = midnight.getTime() - now.getTime();
        
        setTimeout(() => {
            this.performAutoArchive();
            setInterval(() => this.performAutoArchive(), 24 * 60 * 60 * 1000);
        }, timeUntilMidnight);
    }
    
    performAutoArchive() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateKey = this.getDateKey(yesterday);
        
        const allData = {};
        const modules = ['sleep', 'breakfast', 'work', 'chores', 'study', 'lunch', 'nap', 'dinner', 'exercise', 'game', 'entertainment', 'finance'];
        
        modules.forEach(module => {
            const tempData = localStorage.getItem(`${module}_TEMP_${dateKey}`);
            if (tempData) {
                allData[module] = JSON.parse(tempData);
                localStorage.removeItem(`${module}_TEMP_${dateKey}`);
            }
        });
        
        if (Object.keys(allData).length > 0) {
            localStorage.setItem(`archive_${dateKey}`, JSON.stringify(allData));
            console.log(`已归档 ${dateKey} 的数据`);
        }
        
        localStorage.setItem('lastArchive', new Date().toISOString());
    }
    
    generateCalendar(year, month) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const firstDayIndex = firstDay.getDay();
        
        document.getElementById('currentMonthYear').textContent = 
            `${year}年${month + 1}月`;
        
        const container = document.getElementById('calendarDays');
        container.innerHTML = '';
        
        // 空白天数
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day empty';
            container.appendChild(emptyDay);
        }
        
        // 实际天数
        const today = new Date();
        const todayKey = this.getDateKey(today);
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            const date = new Date(year, month, day);
            const dateKey = this.getDateKey(date);
            
            if (dateKey === todayKey) {
                dayElement.classList.add('today');
            }
            
            // 检查是否有记录
            const hasRecord = localStorage.getItem(`archive_${dateKey}`) !== null;
            if (hasRecord) {
                dayElement.classList.add('has-record');
            }
            
            // 检查重要日期
            const importantDates = JSON.parse(localStorage.getItem('important_dates') || '[]');
            const hasImportantDate = importantDates.some(item => {
                const itemDate = new Date(item.date);
                return itemDate.getFullYear() === year && 
                       itemDate.getMonth() === month && 
                       itemDate.getDate() === day;
            });
            
            if (hasImportantDate) {
                dayElement.classList.add('has-important-date');
            }
            
            dayElement.innerHTML = `
                <div class="calendar-day-number">${day}</div>
                <div class="calendar-day-events"></div>
            `;
            
            container.appendChild(dayElement);
        }
    }
    
    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.generateCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
    }
    
    showDateDetails(date) {
        const dateKey = this.getDateKey(date);
        const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        
        document.getElementById('selectedDateTitle').textContent = `${dateStr} 的记录`;
        
        const container = document.getElementById('dateRecords');
        const archiveData = localStorage.getItem(`archive_${dateKey}`);
        
        if (!archiveData) {
            container.innerHTML = '<p>这一天没有记录。</p>';
            return;
        }
        
        const data = JSON.parse(archiveData);
        let html = '';
        
        // 显示各模块记录
        for (const [module, moduleData] of Object.entries(data)) {
            if (!moduleData) continue;
            
            html += `<div class="date-record-item"><strong>${this.getModuleName(module)}:</strong> `;
            
            if (Array.isArray(moduleData)) {
                if (module === 'work') {
                    moduleData.forEach(item => {
                        html += `<div>${item.todo} - ${item.done}</div>`;
                    });
                } else if (module === 'study') {
                    moduleData.forEach(item => {
                        html += `<div>${item.subject}: ${item.duration}小时 - ${item.content}</div>`;
                    });
                } else if (module === 'chores') {
                    html += `<div>完成项目: ${moduleData.join(', ')}</div>`;
                } else if (module === 'exercise') {
                    moduleData.forEach(item => {
                        html += `<div>${item.type}: ${item.duration}小时, ${item.calories}千卡</div>`;
                    });
                } else if (module === 'entertainment') {
                    moduleData.forEach(item => {
                        html += `<div>${item.type}: ${item.duration}小时</div>`;
                    });
                } else if (module === 'game') {
                    moduleData.forEach(item => {
                        html += `<div>${item.name}: ${item.duration}小时</div>`;
                    });
                }
            } else if (typeof moduleData === 'object') {
                if (module === 'sleep' || module === 'nap') {
                    html += `时长: ${moduleData.duration}小时, 质量: ${moduleData.quality}分`;
                } else if (module === 'breakfast' || module === 'lunch' || module === 'dinner') {
                    html += moduleData.content || '';
                } else if (module === 'finance') {
                    if (moduleData.income && moduleData.income.length > 0) {
                        html += `<div>收入: ${moduleData.income.length}笔</div>`;
                    }
                    if (moduleData.expense && moduleData.expense.length > 0) {
                        html += `<div>支出: ${moduleData.expense.length}笔</div>`;
                    }
                }
            }
            
            html += '</div>';
        }
        
        container.innerHTML = html || '<p>没有详细记录。</p>';
    }
    
    getModuleName(module) {
        const names = {
            sleep: '睡眠复盘',
            breakfast: '早餐记录',
            work: '工作看板',
            chores: '家务记录',
            study: '学习记录',
            lunch: '午餐记录',
            nap: '午休记录',
            dinner: '晚餐记录',
            exercise: '运动记录',
            game: '游戏记录',
            entertainment: '娱乐记录',
            finance: '财务记账'
        };
        return names[module] || module;
    }
    
    loadImportantDates() {
        const dates = JSON.parse(localStorage.getItem('important_dates') || '[]');
        const container = document.getElementById('importantDatesList');
        container.innerHTML = '';
        
        dates.forEach((date, index) => {
            const dateObj = new Date(date.date);
            const dateStr = `${dateObj.getFullYear()}年${dateObj.getMonth() + 1}月${dateObj.getDate()}日`;
            
            const item = document.createElement('div');
            item.className = 'important-date-item';
            item.style.borderLeftColor = date.color;
            item.innerHTML = `
                <div class="important-date-info">
                    <h4>${date.title}</h4>
                    <div class="important-date-meta">
                        ${dateStr} · ${date.type}
                    </div>
                </div>
                <button class="delete-date-btn" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            container.appendChild(item);
        });
        
        // 添加删除事件
        container.querySelectorAll('.delete-date-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.deleteImportantDate(parseInt(btn.dataset.index));
            });
        });
    }
    
    addImportantDate() {
        const title = document.getElementById('dateTitle').value;
        const date = document.getElementById('dateDate').value;
        const type = document.getElementById('dateType').value;
        const color = document.getElementById('dateColor').value;
        
        if (!title || !date) {
            this.showNotification('请填写所有必填项', 'warning');
            return;
        }
        
        const dates = JSON.parse(localStorage.getItem('important_dates') || '[]');
        dates.push({ title, date, type, color });
        localStorage.setItem('important_dates', JSON.stringify(dates));
        
        document.getElementById('importantDateForm').reset();
        document.getElementById('dateColor').value = '#FF6B6B';
        
        this.loadImportantDates();
        this.generateCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
        this.showNotification('重要日期已添加', 'success');
    }
    
    deleteImportantDate(index) {
        const dates = JSON.parse(localStorage.getItem('important_dates') || '[]');
        dates.splice(index, 1);
        localStorage.setItem('important_dates', JSON.stringify(dates));
        
        this.loadImportantDates();
        this.generateCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
        this.showNotification('重要日期已删除', 'success');
    }
    
    refreshAnalytics() {
        const period = parseInt(document.getElementById('analyticsPeriod').value) || 30;
        this.generateHealthStats(period);
        this.generateStudyStats(period);
        this.generateChoresStats(period);
        this.generateFinanceStats(period);
        this.generateEntertainmentStats(period);
        this.generateAcStats(period);
    }
    
    generateHealthStats(days) {
        const stats = { sleepQuality: 0, sleepDays: 0, exerciseDays: 0, totalCalories: 0, totalExerciseHours: 0 };
        
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = this.getDateKey(date);
            const archive = localStorage.getItem(`archive_${dateKey}`);
            
            if (archive) {
                const data = JSON.parse(archive);
                
                // 睡眠数据
                if (data.sleep) {
                    stats.sleepQuality += parseFloat(data.sleep.quality) || 0;
                    stats.sleepDays++;
                }
                
                // 运动数据
                if (data.exercise && Array.isArray(data.exercise)) {
                    stats.exerciseDays++;
                    data.exercise.forEach(ex => {
                        stats.totalCalories += parseFloat(ex.calories) || 0;
                        stats.totalExerciseHours += parseFloat(ex.duration) || 0;
                    });
                }
            }
        }
        
        const healthStatsContainer = document.getElementById('healthStats');
        healthStatsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${stats.sleepDays > 0 ? (stats.sleepQuality / stats.sleepDays).toFixed(1) : 0}</div>
                <div class="stat-label">平均睡眠质量</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.exerciseDays}</div>
                <div class="stat-label">运动天数</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.totalExerciseHours.toFixed(1)}</div>
                <div class="stat-label">总运动时长(小时)</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${Math.round(stats.totalCalories)}</div>
                <div class="stat-label">总消耗热量(千卡)</div>
            </div>
        `;
    }
    
    generateStudyStats(days) {
        const stats = { totalHours: 0, subjects: {} };
        
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = this.getDateKey(date);
            const archive = localStorage.getItem(`archive_${dateKey}`);
            
            if (archive) {
                const data = JSON.parse(archive);
                
                if (data.study && Array.isArray(data.study)) {
                    data.study.forEach(item => {
                        const hours = parseFloat(item.duration) || 0;
                        stats.totalHours += hours;
                        
                        const subject = item.subject || '其他';
                        stats.subjects[subject] = (stats.subjects[subject] || 0) + hours;
                    });
                }
            }
        }
        
        // 生成科目分布HTML
        let subjectsHtml = '';
        const sortedSubjects = Object.entries(stats.subjects)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        sortedSubjects.forEach(([subject, hours]) => {
            subjectsHtml += `
                <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
                    <span>${subject}</span>
                    <span style="font-weight: bold; color: var(--primary-color);">${hours.toFixed(1)}小时</span>
                </div>
            `;
        });
        
        const studyStatsContainer = document.getElementById('studyStats');
        studyStatsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${stats.totalHours.toFixed(1)}</div>
                <div class="stat-label">总学习时长(小时)</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${(stats.totalHours / days).toFixed(1)}</div>
                <div class="stat-label">日均学习时长</div>
            </div>
            <div class="stat-item">
                <div class="stat-label" style="text-align: left; margin-top: 15px; font-weight: bold;">科目分布TOP5</div>
                <div style="margin-top: 10px; text-align: left;">
                    ${subjectsHtml || '<p style="color: var(--light-text); font-size: 0.9rem;">暂无数据</p>'}
                </div>
            </div>
        `;
    }
    
    generateChoresStats(days) {
        const stats = { totalScore: 0, choresCount: {} };
        
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = this.getDateKey(date);
            const archive = localStorage.getItem(`archive_${dateKey}`);
            
            if (archive) {
                const data = JSON.parse(archive);
                
                if (data.chores && Array.isArray(data.chores)) {
                    stats.totalScore += data.chores.length;
                    
                    data.chores.forEach(chore => {
                        stats.choresCount[chore] = (stats.choresCount[chore] || 0) + 1;
                    });
                }
            }
        }
        
        // 生成家务频率HTML
        let choresHtml = '';
        const sortedChores = Object.entries(stats.choresCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        sortedChores.forEach(([chore, count]) => {
            choresHtml += `
                <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
                    <span>${chore}</span>
                    <span style="font-weight: bold; color: var(--primary-color);">${count}次</span>
                </div>
            `;
        });
        
        const choresStatsContainer = document.getElementById('choresStats');
        choresStatsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${stats.totalScore}</div>
                <div class="stat-label">家务总得分</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${(stats.totalScore / days).toFixed(1)}</div>
                <div class="stat-label">日均家务得分</div>
            </div>
            <div class="stat-item">
                <div class="stat-label" style="text-align: left; margin-top: 15px; font-weight: bold;">家务频率TOP5</div>
                <div style="margin-top: 10px; text-align: left;">
                    ${choresHtml || '<p style="color: var(--light-text); font-size: 0.9rem;">暂无数据</p>'}
                </div>
            </div>
        `;
    }
    
    generateFinanceStats(days) {
        const stats = { totalIncome: 0, totalExpense: 0, incomeByCat: {}, expenseByCat: {} };
        
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = this.getDateKey(date);
            const archive = localStorage.getItem(`archive_${dateKey}`);
            
            if (archive) {
                const data = JSON.parse(archive);
                
                if (data.finance) {
                    // 收入
                    if (data.finance.income && Array.isArray(data.finance.income)) {
                        data.finance.income.forEach(item => {
                            const amount = parseFloat(item.amount) || 0;
                            stats.totalIncome += amount;
                            const cat = item.category || '其他';
                            stats.incomeByCat[cat] = (stats.incomeByCat[cat] || 0) + amount;
                        });
                    }
                    
                    // 支出
                    if (data.finance.expense && Array.isArray(data.finance.expense)) {
                        data.finance.expense.forEach(item => {
                            const amount = parseFloat(item.amount) || 0;
                            stats.totalExpense += amount;
                            const cat = item.category || '其他';
                            stats.expenseByCat[cat] = (stats.expenseByCat[cat] || 0) + amount;
                        });
                    }
                }
            }
        }
        
        const balance = stats.totalIncome - stats.totalExpense;
        
        const financeStatsContainer = document.getElementById('financeStats');
        financeStatsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">¥${stats.totalIncome.toFixed(2)}</div>
                <div class="stat-label">总收入</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">¥${stats.totalExpense.toFixed(2)}</div>
                <div class="stat-label">总支出</div>
            </div>
            <div class="stat-item" style="border-color: ${balance >= 0 ? 'var(--success-color)' : 'var(--danger-color)'};">
                <div class="stat-value" style="color: ${balance >= 0 ? 'var(--success-color)' : 'var(--danger-color)'};">¥${balance.toFixed(2)}</div>
                <div class="stat-label">结余</div>
            </div>
        `;
    }
    
    generateEntertainmentStats(days) {
        const stats = { totalHours: 0, byType: {} };
        
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = this.getDateKey(date);
            const archive = localStorage.getItem(`archive_${dateKey}`);
            
            if (archive) {
                const data = JSON.parse(archive);
                
                if (data.entertainment && Array.isArray(data.entertainment)) {
                    data.entertainment.forEach(item => {
                        const hours = parseFloat(item.duration) || 0;
                        stats.totalHours += hours;
                        const type = item.type || '其他';
                        stats.byType[type] = (stats.byType[type] || 0) + hours;
                    });
                }
            }
        }
        
        // 生成娱乐类型HTML
        let entertainmentHtml = '';
        const sortedTypes = Object.entries(stats.byType)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        sortedTypes.forEach(([type, hours]) => {
            entertainmentHtml += `
                <div style="margin-bottom: 8px; display: flex; justify-content: space-between;">
                    <span>${type}</span>
                    <span style="font-weight: bold; color: var(--primary-color);">${hours.toFixed(1)}小时</span>
                </div>
            `;
        });
        
        const entertainmentStatsContainer = document.getElementById('entertainmentStats');
        entertainmentStatsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${stats.totalHours.toFixed(1)}</div>
                <div class="stat-label">娱乐总时长(小时)</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${(stats.totalHours / days).toFixed(1)}</div>
                <div class="stat-label">日均娱乐时长</div>
            </div>
            <div class="stat-item">
                <div class="stat-label" style="text-align: left; margin-top: 15px; font-weight: bold;">娱乐类型TOP5</div>
                <div style="margin-top: 10px; text-align: left;">
                    ${entertainmentHtml || '<p style="color: var(--light-text); font-size: 0.9rem;">暂无数据</p>'}
                </div>
            </div>
        `;
    }
    
    generateAcStats(days) {
        const stats = { 
            totalGreetings: 0, 
            totalGifts: 0,
            byVersion: { '小航小刀小岛': 0, '刀刀航航岛岛': 0 }
        };
        
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = this.getDateKey(date);
            const checkinData = localStorage.getItem(`checkin_${dateKey}`);
            
            if (checkinData) {
                const data = JSON.parse(checkinData);
                
                if (data.animalCrossing) {
                    const version = data.animalCrossing.version;
                    stats.byVersion[version] = (stats.byVersion[version] || 0) + 1;
                    
                    if (data.animalCrossing.npcStatus) {
                        Object.values(data.animalCrossing.npcStatus).forEach(status => {
                            if (status.greeting) stats.totalGreetings++;
                            if (status.gift) stats.totalGifts++;
                        });
                    }
                }
            }
        }
        
        const totalPossible = days * 10 * 2;
        const completionRate = totalPossible > 0 ? 
            ((stats.totalGreetings + stats.totalGifts) / totalPossible * 100).toFixed(1) : 0;
        
        const version1 = stats.byVersion['小航小刀小岛'] || 0;
        const version2 = stats.byVersion['刀刀航航岛岛'] || 0;
        const totalDays = version1 + version2;
        const version1Percent = totalDays > 0 ? ((version1 / totalDays) * 100).toFixed(1) : 0;
        const version2Percent = totalDays > 0 ? ((version2 / totalDays) * 100).toFixed(1) : 0;
        
        const versionStatsContainer = document.getElementById('acVersionStats');
        versionStatsContainer.innerHTML = `
            <h4>版本使用统计</h4>
            <div style="margin-top: 15px;">
                <div style="margin-bottom: 10px; display: flex; justify-content: space-between;">
                    <span>小航小刀小岛:</span>
                    <span style="font-weight: bold;">${version1} 天 (${version1Percent}%)</span>
                </div>
                <div style="margin-bottom: 10px; display: flex; justify-content: space-between;">
                    <span>刀刀航航岛岛:</span>
                    <span style="font-weight: bold;">${version2} 天 (${version2Percent}%)</span>
                </div>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border-color);">
                    <strong>总计:</strong> ${totalDays} 天
                </div>
            </div>
        `;
        
        const npcStatsContainer = document.getElementById('acNpcStats');
        npcStatsContainer.innerHTML = `
            <h4>互动统计</h4>
            <div style="margin-top: 15px;">
                <div style="margin-bottom: 10px; display: flex; justify-content: space-between;">
                    <span>打招呼次数:</span>
                    <span style="font-weight: bold; color: var(--ac-green);">${stats.totalGreetings}</span>
                </div>
                <div style="margin-bottom: 10px; display: flex; justify-content: space-between;">
                    <span>送礼物次数:</span>
                    <span style="font-weight: bold; color: var(--ac-green);">${stats.totalGifts}</span>
                </div>
                <div style="margin-bottom: 15px; display: flex; justify-content: space-between;">
                    <span>总互动次数:</span>
                    <span style="font-weight: bold; color: var(--primary-color);">${stats.totalGreetings + stats.totalGifts}</span>
                </div>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border-color);">
                    <div style="font-size: 1.2rem; font-weight: bold; text-align: center; color: ${completionRate >= 80 ? 'var(--success-color)' : completionRate >= 50 ? 'var(--warning-color)' : 'var(--danger-color)'};">
                        完成率: ${completionRate}%
                    </div>
                    <div style="font-size: 0.9rem; color: var(--light-text); text-align: center; margin-top: 5px;">
                        已完成 ${stats.totalGreetings + stats.totalGifts} / ${totalPossible} 次
                    </div>
                </div>
            </div>
        `;
    }
    
    async testGitHubConnection() {
        const token = document.getElementById('githubToken').value;
        if (!token) {
            this.showNotification('请输入GitHub Token', 'warning');
            return;
        }
        
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const user = await response.json();
                this.showNotification(`连接成功！用户: ${user.login}`, 'success');
                document.getElementById('syncStatus').innerHTML = `<div style="color: var(--success-color);"><i class="fas fa-check-circle"></i> 连接成功 (${user.login})</div>`;
                return true;
            } else {
                this.showNotification('连接失败，请检查Token是否正确', 'error');
                document.getElementById('syncStatus').innerHTML = `<div style="color: var(--danger-color);"><i class="fas fa-times-circle"></i> 连接失败</div>`;
                return false;
            }
        } catch (error) {
            this.showNotification(`连接错误: ${error.message}`, 'error');
            document.getElementById('syncStatus').innerHTML = `<div style="color: var(--danger-color);"><i class="fas fa-times-circle"></i> 连接错误</div>`;
            return false;
        }
    }
    
    async backupToGitHub() {
        if (!await this.testGitHubConnection()) return;
        
        const token = document.getElementById('githubToken').value;
        const gistId = document.getElementById('gistId').value || null;
        const encryptionKey = document.getElementById('encryptionKey').value || 'xiaohang-xiaodao-xiaodao';
        
        try {
            document.getElementById('syncStatus').innerHTML = `<div><i class="fas fa-spinner fa-spin"></i> 正在备份数据...</div>`;
            
            // 收集所有数据
            const allData = {};
            const keys = Object.keys(localStorage);
            
            keys.forEach(key => {
                allData[key] = localStorage.getItem(key);
            });
            
            // 简单加密（实际应用中应使用更安全的加密方式）
            const encryptedData = btoa(JSON.stringify(allData));
            
            // 准备Gist数据
            const gistData = {
                description: `小航小刀小岛备份 ${new Date().toLocaleString('zh-CN')}`,
                public: false,
                files: {
                    'life-manager-backup.json': {
                        content: encryptedData
                    }
                }
            };
            
            let response;
            
            if (gistId) {
                // 更新现有Gist
                response = await fetch(`https://api.github.com/gists/${gistId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    body: JSON.stringify(gistData)
                });
            } else {
                // 创建新Gist
                response = await fetch('https://api.github.com/gists', {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    body: JSON.stringify(gistData)
                });
            }
            
            if (response.ok) {
                const result = await response.json();
                document.getElementById('gistId').value = result.id;
                localStorage.setItem('lastGistId', result.id);
                localStorage.setItem('lastBackup', new Date().toISOString());
                document.getElementById('lastBackup').textContent = new Date().toLocaleString('zh-CN');
                document.getElementById('syncStatus').innerHTML = `<div style="color: var(--success-color);"><i class="fas fa-check-circle"></i> 数据备份成功！Gist ID: ${result.id.substring(0, 8)}...</div>`;
                this.showNotification('数据备份成功！', 'success');
            } else {
                const error = await response.json();
                document.getElementById('syncStatus').innerHTML = `<div style="color: var(--danger-color);"><i class="fas fa-times-circle"></i> 备份失败: ${error.message || '未知错误'}</div>`;
                this.showNotification('备份失败，请重试', 'error');
            }
        } catch (error) {
            document.getElementById('syncStatus').innerHTML = `<div style="color: var(--danger-color);"><i class="fas fa-times-circle"></i> 备份错误: ${error.message}</div>`;
            this.showNotification(`备份错误: ${error.message}`, 'error');
        }
    }
    
    async restoreFromGitHub() {
        if (!await this.testGitHubConnection()) return;
        
        const token = document.getElementById('githubToken').value;
        const gistId = document.getElementById('gistId').value;
        const encryptionKey = document.getElementById('encryptionKey').value || 'xiaohang-xiaodao-xiaodao';
        
        if (!gistId) {
            this.showNotification('请输入Gist ID', 'warning');
            return;
        }
        
        try {
            document.getElementById('syncStatus').innerHTML = `<div><i class="fas fa-spinner fa-spin"></i> 正在恢复数据...</div>`;
            
            const response = await fetch(`https://api.github.com/gists/${gistId}`, {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const gist = await response.json();
                const encryptedData = gist.files['life-manager-backup.json'].content;
                
                // 解密数据
                const decryptedData = JSON.parse(atob(encryptedData));
                
                // 恢复数据到localStorage
                Object.keys(decryptedData).forEach(key => {
                    localStorage.setItem(key, decryptedData[key]);
                });
                
                localStorage.setItem('lastRestore', new Date().toISOString());
                document.getElementById('lastRestore').textContent = new Date().toLocaleString('zh-CN');
                
                // 刷新界面
                this.loadTempData();
                this.loadCheckinData();
                this.loadImportantDates();
                this.generateCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
                this.updateOverviewData();
                
                document.getElementById('syncStatus').innerHTML = `<div style="color: var(--success-color);"><i class="fas fa-check-circle"></i> 数据恢复成功！</div>`;
                this.showNotification('数据恢复成功！', 'success');
            } else {
                const error = await response.json();
                document.getElementById('syncStatus').innerHTML = `<div style="color: var(--danger-color);"><i class="fas fa-times-circle"></i> 恢复失败: ${error.message || '未知错误'}</div>`;
                this.showNotification('恢复失败，请检查Gist ID是否正确', 'error');
            }
        } catch (error) {
            document.getElementById('syncStatus').innerHTML = `<div style="color: var(--danger-color);"><i class="fas fa-times-circle"></i> 恢复错误: ${error.message}</div>`;
            this.showNotification(`恢复错误: ${error.message}`, 'error');
        }
    }
    
    exportData() {
        const allData = {};
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            allData[key] = localStorage.getItem(key);
        });
        
        const dataStr = JSON.stringify(allData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `小航小刀小岛备份_${this.getDateKey()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showNotification('数据导出成功', 'success');
    }
    
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = event => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    
                    Object.keys(importedData).forEach(key => {
                        localStorage.setItem(key, importedData[key]);
                    });
                    
                    this.loadTempData();
                    this.loadCheckinData();
                    this.loadImportantDates();
                    this.generateCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
                    this.updateOverviewData();
                    
                    this.showNotification('数据导入成功！', 'success');
                } catch (error) {
                    this.showNotification('导入失败：文件格式不正确', 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }
    
    clearLocalData() {
        if (confirm('确定要清空所有本地数据吗？此操作不可撤销！')) {
            localStorage.clear();
            location.reload();
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    addDefaultRow(moduleType) {
        switch(moduleType) {
            case 'work':
                this.addWorkRow();
                break;
            case 'study':
                this.addStudyRow();
                break;
            case 'exercise':
                this.addExerciseRow();
                break;
            case 'entertainment':
                this.addEntertainmentRow();
                break;
            case 'finance':
                this.addIncomeRow();
                this.addExpenseRow();
                break;
            case 'game':
                this.addGameRow();
                break;
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LifeManagerApp();
});