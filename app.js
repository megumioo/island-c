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
            });
        });
        
        // 动态添加行
        document.querySelector('.add-row-btn')?.addEventListener('click', () => this.addWorkRow());
        document.querySelector('.add-study-btn')?.addEventListener('click', () => this.addStudyRow());
        document.querySelector('.add-exercise-btn')?.addEventListener('click', () => this.addExerciseRow());
        document.querySelector('.add-entertainment-btn')?.addEventListener('click', () => this.addEntertainmentRow());
        document.querySelector('.add-income-btn')?.addEventListener('click', () => this.addIncomeRow());
        document.querySelector('.add-expense-btn')?.addEventListener('click', () => this.addExpenseRow());
        
        // 删除行
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-row-btn') || 
                e.target.parentElement.classList.contains('remove-row-btn')) {
                const btn = e.target.classList.contains('remove-row-btn') ? e.target : e.target.parentElement;
                const row = btn.closest('.work-row, .study-row, .exercise-row, .entertainment-row, .finance-row');
                if (row) {
                    row.remove();
                    if (row.parentElement.children.length === 0) {
                        this.addDefaultRow(row.parentElement.parentElement.dataset.module);
                    }
                }
            }
        });
        
        // 家务记录计分
        document.querySelectorAll('.chore-item').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateChoresScore());
        });
        
        // 打卡保存
        document.getElementById('saveCheckinBtn')?.addEventListener('click', () => this.saveCheckinData());
        
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
                card.querySelectorAll('.work-row').forEach(row => {
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
                card.querySelectorAll('.study-row').forEach(row => {
                    studyEntries.push({
                        subject: row.querySelector('.study-subject').value,
                        duration: row.querySelector('.study-duration').value,
                        content: row.querySelector('.study-content').value,
                        summary: row.querySelector('.study-summary').value
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
                card.querySelectorAll('.exercise-row').forEach(row => {
                    exerciseEntries.push({
                        type: row.querySelector('.exercise-type').value,
                        duration: row.querySelector('.exercise-duration').value,
                        calories: row.querySelector('.exercise-calories').value,
                        feeling: row.querySelector('.exercise-feeling').value
                    });
                });
                data = exerciseEntries;
                break;
                
            case 'game':
                data = {
                    name: card.querySelector('.game-name').value,
                    duration: card.querySelector('.game-duration').value,
                    feeling: card.querySelector('.game-feeling').value
                };
                break;
                
            case 'entertainment':
                const entertainmentEntries = [];
                card.querySelectorAll('.entertainment-row').forEach(row => {
                    entertainmentEntries.push({
                        type: row.querySelector('.entertainment-type').value,
                        duration: row.querySelector('.entertainment-duration').value,
                        feeling: row.querySelector('.entertainment-feeling').value
                    });
                });
                data = entertainmentEntries;
                break;
                
            case 'finance':
                const incomeEntries = [];
                const expenseEntries = [];
                
                card.querySelectorAll('.income-entries .finance-row').forEach(row => {
                    incomeEntries.push({
                        category: row.querySelector('.income-category').value,
                        amount: row.querySelector('.income-amount').value,
                        description: row.querySelector('.income-description').value
                    });
                });
                
                card.querySelectorAll('.expense-entries .finance-row').forEach(row => {
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
            
            if (!data) return;
            
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
                    if (Array.isArray(parsedData)) {
                        parsedData.forEach(entry => {
                            this.addWorkRow(entry.todo, entry.done);
                        });
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
                    if (Array.isArray(parsedData)) {
                        parsedData.forEach(entry => {
                            this.addStudyRow(entry.subject, entry.duration, entry.content, entry.summary);
                        });
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
                    if (Array.isArray(parsedData)) {
                        parsedData.forEach(entry => {
                            this.addExerciseRow(entry.type, entry.duration, entry.calories, entry.feeling);
                        });
                    }
                    break;
                    
                case 'game':
                    card.querySelector('.game-name').value = parsedData.name || '';
                    card.querySelector('.game-duration').value = parsedData.duration || '';
                    card.querySelector('.game-feeling').value = parsedData.feeling || '';
                    break;
                    
                case 'entertainment':
                    const entertainmentContainer = card.querySelector('.entertainment-entries');
                    entertainmentContainer.innerHTML = '';
                    if (Array.isArray(parsedData)) {
                        parsedData.forEach(entry => {
                            this.addEntertainmentRow(entry.type, entry.duration, entry.feeling);
                        });
                    }
                    break;
                    
                case 'finance':
                    if (parsedData.income && Array.isArray(parsedData.income)) {
                        const incomeContainer = card.querySelector('.income-entries');
                        incomeContainer.innerHTML = '';
                        parsedData.income.forEach(entry => {
                            this.addIncomeRow(entry.category, entry.amount, entry.description);
                        });
                    }
                    
                    if (parsedData.expense && Array.isArray(parsedData.expense)) {
                        const expenseContainer = card.querySelector('.expense-entries');
                        expenseContainer.innerHTML = '';
                        parsedData.expense.forEach(entry => {
                            this.addExpenseRow(entry.category, entry.amount, entry.description);
                        });
                    }
                    break;
            }
        });
    }
    
    addWorkRow(todo = '', done = '') {
        const container = document.querySelector('.work-entries');
        const row = document.createElement('div');
        row.className = 'work-row';
        row.innerHTML = `
            <div class="form-group">
                <input type="text" class="work-todo" placeholder="待办事项" value="${todo}">
            </div>
            <div class="form-group">
                <input type="text" class="work-done" placeholder="完成情况" value="${done}">
            </div>
            <button type="button" class="remove-row-btn"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(row);
    }
    
    addStudyRow(subject = '逻辑', duration = '', content = '', summary = '') {
        const container = document.querySelector('.study-entries');
        const row = document.createElement('div');
        row.className = 'study-row';
        row.innerHTML = `
            <div class="form-group">
                <label>科目:</label>
                <select class="study-subject">
                    <option value="逻辑" ${subject === '逻辑' ? 'selected' : ''}>逻辑</option>
                    <option value="数学" ${subject === '数学' ? 'selected' : ''}>数学</option>
                    <option value="英语" ${subject === '英语' ? 'selected' : ''}>英语</option>
                    <option value="写作" ${subject === '写作' ? 'selected' : ''}>写作</option>
                    <option value="其他" ${subject === '其他' ? 'selected' : ''}>其他</option>
                </select>
            </div>
            <div class="form-group">
                <label>时长 (小时):</label>
                <input type="number" step="0.1" min="0" class="study-duration" placeholder="例如: 2" value="${duration}">
            </div>
            <div class="form-group full-width">
                <label>学习内容:</label>
                <textarea class="study-content" rows="2" placeholder="学习了什么？">${content}</textarea>
            </div>
            <div class="form-group full-width">
                <label>学习总结:</label>
                <textarea class="study-summary" rows="2" placeholder="有什么收获？">${summary}</textarea>
            </div>
            <button type="button" class="remove-row-btn"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(row);
    }
    
    addExerciseRow(type = '有氧', duration = '', calories = '', feeling = '') {
        const container = document.querySelector('.exercise-entries');
        const row = document.createElement('div');
        row.className = 'exercise-row';
        row.innerHTML = `
            <div class="form-group">
                <label>运动类型:</label>
                <select class="exercise-type">
                    <option value="有氧" ${type === '有氧' ? 'selected' : ''}>有氧</option>
                    <option value="无氧" ${type === '无氧' ? 'selected' : ''}>无氧</option>
                    <option value="力量" ${type === '力量' ? 'selected' : ''}>力量</option>
                    <option value="拉伸" ${type === '拉伸' ? 'selected' : ''}>拉伸</option>
                    <option value="舞力全开" ${type === '舞力全开' ? 'selected' : ''}>舞力全开</option>
                </select>
            </div>
            <div class="form-group">
                <label>时长 (小时):</label>
                <input type="number" step="0.1" min="0" class="exercise-duration" placeholder="例如: 1" value="${duration}">
            </div>
            <div class="form-group">
                <label>消耗热量 (千卡):</label>
                <input type="number" min="0" class="exercise-calories" placeholder="例如: 300" value="${calories}">
            </div>
            <div class="form-group full-width">
                <label>运动感受:</label>
                <textarea class="exercise-feeling" rows="2" placeholder="感觉如何？">${feeling}</textarea>
            </div>
            <button type="button" class="remove-row-btn"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(row);
    }
    
    addEntertainmentRow(type = '动画', duration = '', feeling = '') {
        const container = document.querySelector('.entertainment-entries');
        const row = document.createElement('div');
        row.className = 'entertainment-row';
        row.innerHTML = `
            <div class="form-group">
                <label>娱乐类型:</label>
                <select class="entertainment-type">
                    <option value="动画" ${type === '动画' ? 'selected' : ''}>动画</option>
                    <option value="电影" ${type === '电影' ? 'selected' : ''}>电影</option>
                    <option value="拼豆" ${type === '拼豆' ? 'selected' : ''}>拼豆</option>
                    <option value="美甲" ${type === '美甲' ? 'selected' : ''}>美甲</option>
                    <option value="其他" ${type === '其他' ? 'selected' : ''}>其他</option>
                </select>
            </div>
            <div class="form-group">
                <label>时长 (小时):</label>
                <input type="number" step="0.1" min="0" class="entertainment-duration" placeholder="例如: 1.5" value="${duration}">
            </div>
            <div class="form-group full-width">
                <label>娱乐感受:</label>
                <textarea class="entertainment-feeling" rows="2" placeholder="感觉如何？">${feeling}</textarea>
            </div>
            <button type="button" class="remove-row-btn"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(row);
    }
    
    addIncomeRow(category = '工资', amount = '', description = '') {
        const container = document.querySelector('.income-entries');
        const row = document.createElement('div');
        row.className = 'finance-row';
        row.innerHTML = `
            <div class="form-group">
                <label>分类:</label>
                <select class="income-category">
                    <option value="工资" ${category === '工资' ? 'selected' : ''}>工资</option>
                    <option value="兼职" ${category === '兼职' ? 'selected' : ''}>兼职</option>
                    <option value="礼物" ${category === '礼物' ? 'selected' : ''}>礼物</option>
                    <option value="其他" ${category === '其他' ? 'selected' : ''}>其他</option>
                </select>
            </div>
            <div class="form-group">
                <label>金额:</label>
                <input type="number" min="0" class="income-amount" placeholder="金额" value="${amount}">
            </div>
            <div class="form-group full-width">
                <label>描述:</label>
                <input type="text" class="income-description" placeholder="收入描述" value="${description}">
            </div>
            <button type="button" class="remove-row-btn"><i class="fas fa-times"></i></button>
        `;
        container.appendChild(row);
    }
    
    addExpenseRow(category = '餐饮', amount = '', description = '') {
        const container = document.querySelector('.expense-entries');
        const row = document.createElement('div');
        row.className = 'finance-row';
        row.innerHTML = `
            <div class="form-group">
                <label>分类:</label>
                <select class="expense-category">
                    <option value="餐饮" ${category === '餐饮' ? 'selected' : ''}>餐饮</option>
                    <option value="购物" ${category === '购物' ? 'selected' : ''}>购物</option>
                    <option value="娱乐" ${category === '娱乐' ? 'selected' : ''}>娱乐</option>
                    <option value="交通" ${category === '交通' ? 'selected' : ''}>交通</option>
                    <option value="其他" ${category === '其他' ? 'selected' : ''}>其他</option>
                </select>
            </div>
            <div class="form-group">
                <label>金额:</label>
                <input type="number" min="0" class="expense-amount" placeholder="金额" value="${amount}">
            </div>
            <div class="form-group full-width">
                <label>描述:</label>
                <input type="text" class="expense-description" placeholder="支出描述" value="${description}">
            </div>
            <button type="button" class="remove-row-btn"><i class="fas fa-times"></i></button>
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
                }
            } else if (typeof moduleData === 'object') {
                if (module === 'sleep' || module === 'nap') {
                    html += `时长: ${moduleData.duration}小时, 质量: ${moduleData.quality}分`;
                } else if (module === 'breakfast' || module === 'lunch' || module === 'dinner') {
                    html += moduleData.content || '';
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
        const stats = { sleepQuality: 0, sleepDays: 0, exerciseDays: 0, totalCalories: 0 };
        const sleepData = [];
        const exerciseData = [];
        
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
                    sleepData.push(parseFloat(data.sleep.quality) || 0);
                }
                
                // 运动数据
                if (data.exercise && Array.isArray(data.exercise)) {
                    stats.exerciseDays++;
                    data.exercise.forEach(ex => {
                        stats.totalCalories += parseFloat(ex.calories) || 0;
                    });
                    exerciseData.push(data.exercise.length);
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
                <div class="stat-value">${Math.round(stats.totalCalories)}</div>
                <div class="stat-label">总消耗热量(千卡)</div>
            </div>
        `;
        
        this.createSleepChart(sleepData);
        this.createExerciseChart(exerciseData);
    }
    
    createSleepChart(data) {
        const ctx = document.getElementById('sleepChart').getContext('2d');
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map((_, i) => `${i + 1}天前`),
                datasets: [{
                    label: '睡眠质量',
                    data: data,
                    borderColor: '#4A90E2',
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: '睡眠质量趋势' }
                }
            }
        });
    }
    
    createExerciseChart(data) {
        const ctx = document.getElementById('exerciseChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map((_, i) => `${i + 1}天前`),
                datasets: [{
                    label: '运动次数',
                    data: data,
                    backgroundColor: '#66BB6A'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: '运动频率' }
                }
            }
        });
    }
    
    generateStudyStats(days) {
        const stats = { totalHours: 0, subjects: {} };
        const studyData = [];
        
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = this.getDateKey(date);
            const archive = localStorage.getItem(`archive_${dateKey}`);
            
            if (archive) {
                const data = JSON.parse(archive);
                
                if (data.study && Array.isArray(data.study)) {
                    let dailyHours = 0;
                    data.study.forEach(item => {
                        const hours = parseFloat(item.duration) || 0;
                        stats.totalHours += hours;
                        dailyHours += hours;
                        
                        const subject = item.subject || '其他';
                        stats.subjects[subject] = (stats.subjects[subject] || 0) + hours;
                    });
                    studyData.push(dailyHours);
                }
            }
        }
        
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
        `;
        
        this.createStudyChart(stats.subjects);
    }
    
    createStudyChart(subjectData) {
        const ctx = document.getElementById('studyChart').getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(subjectData),
                datasets: [{
                    data: Object.values(subjectData),
                    backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: '科目分布' },
                    legend: { position: 'bottom' }
                }
            }
        });
    }
    
    generateChoresStats(days) {
        const stats = { totalScore: 0, choresCount: {} };
        const choresData = [];
        
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = this.getDateKey(date);
            const archive = localStorage.getItem(`archive_${dateKey}`);
            
            if (archive) {
                const data = JSON.parse(archive);
                
                if (data.chores && Array.isArray(data.chores)) {
                    stats.totalScore += data.chores.length;
                    choresData.push(data.chores.length);
                    
                    data.chores.forEach(chore => {
                        stats.choresCount[chore] = (stats.choresCount[chore] || 0) + 1;
                    });
                }
            }
        }
        
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
        `;
        
        this.createChoresChart(Object.entries(stats.choresCount));
    }
    
    createChoresChart(choresData) {
        const ctx = document.getElementById('choresChart').getContext('2d');
        const sortedData = choresData.sort((a, b) => b[1] - a[1]).slice(0, 5);
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedData.map(item => item[0]),
                datasets: [{
                    label: '完成次数',
                    data: sortedData.map(item => item[1]),
                    backgroundColor: '#FFA726'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: '家务完成频率TOP5' }
                }
            }
        });
    }
    
    generateFinanceStats(days) {
        const stats = { totalIncome: 0, totalExpense: 0, incomeByCat: {}, expenseByCat: {} };
        const financeData = [];
        
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
                    
                    financeData.push({
                        income: stats.totalIncome,
                        expense: stats.totalExpense
                    });
                }
            }
        }
        
        const financeStatsContainer = document.getElementById('financeStats');
        financeStatsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${stats.totalIncome.toFixed(2)}</div>
                <div class="stat-label">总收入(元)</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${stats.totalExpense.toFixed(2)}</div>
                <div class="stat-label">总支出(元)</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${(stats.totalIncome - stats.totalExpense).toFixed(2)}</div>
                <div class="stat-label">结余(元)</div>
            </div>
        `;
        
        this.createFinanceChart(stats.incomeByCat, stats.expenseByCat);
    }
    
    createFinanceChart(incomeData, expenseData) {
        const ctx = document.getElementById('financeChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['收入', '支出'],
                datasets: [{
                    data: [
                        Object.values(incomeData).reduce((a, b) => a + b, 0),
                        Object.values(expenseData).reduce((a, b) => a + b, 0)
                    ],
                    backgroundColor: ['#66BB6A', '#EF5350']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: '收支比例' },
                    legend: { position: 'bottom' }
                }
            }
        });
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
        `;
        
        this.createEntertainmentChart(stats.byType);
    }
    
    createEntertainmentChart(typeData) {
        const ctx = document.getElementById('entertainmentChart').getContext('2d');
        new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: Object.keys(typeData),
                datasets: [{
                    data: Object.values(typeData),
                    backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7']
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: { display: true, text: '娱乐类型分布' }
                }
            }
        });
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
        
        const versionStatsContainer = document.getElementById('acVersionStats');
        versionStatsContainer.innerHTML = `
            <h4>版本使用统计</h4>
            <p>小航小刀小岛: ${stats.byVersion['小航小刀小岛'] || 0} 天</p>
            <p>刀刀航航岛岛: ${stats.byVersion['刀刀航航岛岛'] || 0} 天</p>
        `;
        
        const npcStatsContainer = document.getElementById('acNpcStats');
        npcStatsContainer.innerHTML = `
            <h4>互动统计</h4>
            <p>打招呼次数: ${stats.totalGreetings}</p>
            <p>送礼物次数: ${stats.totalGifts}</p>
            <p>总互动次数: ${stats.totalGreetings + stats.totalGifts}</p>
            <p>完成率: ${completionRate}%</p>
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
                return true;
            } else {
                this.showNotification('连接失败，请检查Token是否正确', 'error');
                return false;
            }
        } catch (error) {
            this.showNotification(`连接错误: ${error.message}`, 'error');
            return false;
        }
    }
    
    async backupToGitHub() {
        if (!await this.testGitHubConnection()) return;
        
        const token = document.getElementById('githubToken').value;
        const gistId = document.getElementById('gistId').value || null;
        const encryptionKey = document.getElementById('encryptionKey').value || 'xiaohang-xiaodao-xiaodao';
        
        try {
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
                description: `小航小刀小岛备份 ${new Date().toLocaleString()}`,
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
                document.getElementById('lastBackup').textContent = new Date().toLocaleString();
                this.showNotification('数据备份成功！', 'success');
            } else {
                this.showNotification('备份失败，请重试', 'error');
            }
        } catch (error) {
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
                document.getElementById('lastRestore').textContent = new Date().toLocaleString();
                
                // 刷新界面
                this.loadTempData();
                this.loadCheckinData();
                this.loadImportantDates();
                this.generateCalendar(this.currentDate.getFullYear(), this.currentDate.getMonth());
                
                this.showNotification('数据恢复成功！', 'success');
            } else {
                this.showNotification('恢复失败，请检查Gist ID是否正确', 'error');
            }
        } catch (error) {
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
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LifeManagerApp();
});

// 添加默认行函数
LifeManagerApp.prototype.addDefaultRow = function(moduleType) {
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
    }
};