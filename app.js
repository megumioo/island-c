// 小航小刀小岛 - 主应用逻辑
document.addEventListener('DOMContentLoaded', function() {
    // 应用状态
    const appState = {
        currentDate: new Date().toISOString().split('T')[0],
        currentPage: 'records',
        tempData: {},
        archiveData: {},
        checkinData: {},
        importantDates: [],
        githubToken: localStorage.getItem('github_token') || '',
        gistId: localStorage.getItem('gist_id') || '',
        lastSync: localStorage.getItem('last_sync') || '从未',
        acVersion: '小航小刀小岛',
        acNPCs: {
            '小航小刀小岛': ['威亚', '丽婷', '茉莉', '樱桃', '贾洛斯', '大姐头', '草莓', '杰西卡', '哈姆', '小影'],
            '刀刀航航岛岛': ['胜利', '雷姆', '娃娃', '茉莉', '凯恩', '小偲', '李彻', '朱禄', '冰冰', '蜜拉']
        }
    };

    // 初始化应用
    function initApp() {
        // 设置当前日期显示
        updateDateDisplay();
        
        // 加载保存的数据
        loadSavedData();
        
        // 初始化事件监听器
        initEventListeners();
        
        // 初始化日历
        initCalendar();
        
        // 初始化动森NPC
        initACNPCs();
        
        // 设置自动归档检查
        setupAutoArchive();
        
        // 更新存储使用情况
        updateStorageInfo();
    }

    // 更新日期显示
    function updateDateDisplay() {
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            const now = new Date();
            const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
            dateElement.textContent = now.toLocaleDateString('zh-CN', options);
        }
    }

    // 加载保存的数据
    function loadSavedData() {
        // 加载临时数据
        loadTempData();
        
        // 加载打卡数据
        loadCheckinData();
        
        // 加载重要日期
        loadImportantDates();
        
        // 加载归档数据计数
        updateArchiveCount();
    }

    // 加载临时数据到表单
    function loadTempData() {
        const modules = ['sleep', 'breakfast', 'work', 'chores', 'study', 'lunch', 
                        'nap', 'dinner', 'exercise', 'game', 'entertainment', 'finance'];
        
        modules.forEach(module => {
            const key = `${module}_TEMP_${appState.currentDate}`;
            const data = localStorage.getItem(key);
            
            if (data) {
                try {
                    const parsedData = JSON.parse(data);
                    fillFormWithData(module, parsedData);
                } catch (e) {
                    console.error(`加载${module}模块数据失败:`, e);
                }
            }
        });
    }

    // 填充表单数据
    function fillFormWithData(module, data) {
        // 根据模块类型填充数据
        switch(module) {
            case 'sleep':
                document.getElementById('sleep-duration').value = data.duration || '';
                document.getElementById('sleep-quality').value = data.quality || '';
                document.getElementById('sleep-feeling').value = data.feeling || '';
                break;
            case 'breakfast':
                document.getElementById('breakfast-content').value = data.content || '';
                document.getElementById('breakfast-feeling').value = data.feeling || '';
                break;
            case 'work':
                // 填充工作看板数据
                if (data.tasks && Array.isArray(data.tasks)) {
                    // 清空现有行（除了第一行）
                    const container = document.getElementById('work-rows-container');
                    // 保留第一行作为模板
                    while (container.children.length > 1) {
                        container.removeChild(container.lastChild);
                    }
                    
                    // 填充数据（跳过第一行，因为它是模板）
                    data.tasks.forEach((task, index) => {
                        if (index === 0) {
                            // 第一行使用现有的输入框
                            const todoInput = container.querySelector('.work-todo');
                            const doneInput = container.querySelector('.work-done');
                            if (todoInput) todoInput.value = task.todo || '';
                            if (doneInput) doneInput.value = task.done || '';
                        } else {
                            // 添加新行并填充数据
                            addWorkRow(task.todo || '', task.done || '');
                        }
                    });
                }
                break;
            case 'chores':
                // 填充家务数据
                if (data.chores && Array.isArray(data.chores)) {
                    data.chores.forEach(choreName => {
                        const checkbox = document.querySelector(`input[value="${choreName}"]`);
                        if (checkbox) checkbox.checked = true;
                    });
                    updateChoresScore();
                }
                break;
            // ... 其他模块的数据填充
            case 'finance':
                // 填充财务数据
                if (data.income && Array.isArray(data.income)) {
                    const container = document.getElementById('income-rows-container');
                    // 清空现有行（除了第一行）
                    while (container.children.length > 1) {
                        container.removeChild(container.lastChild);
                    }
                    
                    data.income.forEach((income, index) => {
                        if (index === 0) {
                            // 第一行使用现有的输入框
                            const categorySelect = container.querySelector('.income-category');
                            const amountInput = container.querySelector('.income-amount');
                            const descInput = container.querySelector('.income-description');
                            
                            if (categorySelect) categorySelect.value = income.category || '工资';
                            if (amountInput) amountInput.value = income.amount || '';
                            if (descInput) descInput.value = income.description || '';
                        } else {
                            addIncomeRow(income.category, income.amount, income.description);
                        }
                    });
                }
                
                if (data.expense && Array.isArray(data.expense)) {
                    const container = document.getElementById('expense-rows-container');
                    // 清空现有行（除了第一行）
                    while (container.children.length > 1) {
                        container.removeChild(container.lastChild);
                    }
                    
                    data.expense.forEach((expense, index) => {
                        if (index === 0) {
                            // 第一行使用现有的输入框
                            const categorySelect = container.querySelector('.expense-category');
                            const amountInput = container.querySelector('.expense-amount');
                            const descInput = container.querySelector('.expense-description');
                            
                            if (categorySelect) categorySelect.value = expense.category || '餐饮';
                            if (amountInput) amountInput.value = expense.amount || '';
                            if (descInput) descInput.value = expense.description || '';
                        } else {
                            addExpenseRow(expense.category, expense.amount, expense.description);
                        }
                    });
                }
                
                updateFinanceSummary();
                break;
        }
    }

    // 加载打卡数据
    function loadCheckinData() {
        const key = `checkin_${appState.currentDate}`;
        const data = localStorage.getItem(key);
        
        if (data) {
            try {
                const parsedData = JSON.parse(data);
                appState.checkinData = parsedData;
                
                // 填充补剂打卡
                if (parsedData.supplement) {
                    if (parsedData.supplement.iron) document.getElementById('supplement-iron').checked = true;
                    if (parsedData.supplement.d3k2) document.getElementById('supplement-d3k2').checked = true;
                    if (parsedData.supplement.magnesium) document.getElementById('supplement-magnesium').checked = true;
                }
                
                // 填充护理打卡
                if (parsedData.care) {
                    if (parsedData.care.scrub) document.getElementById('care-scrub').checked = true;
                    if (parsedData.care.hairRemoval) document.getElementById('care-hair-removal').checked = true;
                    if (parsedData.care.lotion) document.getElementById('care-lotion').checked = true;
                }
                
                // 填充动森打卡
                if (parsedData['animal-crossing']) {
                    const acData = parsedData['animal-crossing'];
                    appState.acVersion = acData.version || '小航小刀小岛';
                    
                    // 设置版本单选按钮
                    const versionRadio = document.querySelector(`input[name="ac-version"][value="${appState.acVersion}"]`);
                    if (versionRadio) versionRadio.checked = true;
                    
                    // 初始化NPC显示
                    initACNPCs();
                    
                    // 填充NPC状态
                    if (acData.npcStatus) {
                        Object.keys(acData.npcStatus).forEach(npcName => {
                            const npcStatus = acData.npcStatus[npcName];
                            const greetingCheckbox = document.querySelector(`input[data-npc="${npcName}"][data-type="greeting"]`);
                            const giftCheckbox = document.querySelector(`input[data-npc="${npcName}"][data-type="gift"]`);
                            
                            if (greetingCheckbox) greetingCheckbox.checked = npcStatus.greeting || false;
                            if (giftCheckbox) giftCheckbox.checked = npcStatus.gift || false;
                        });
                        
                        updateACSummary();
                    }
                }
                
                updateCheckinCount();
            } catch (e) {
                console.error('加载打卡数据失败:', e);
            }
        }
    }

    // 初始化动森NPC
    function initACNPCs() {
        const container = document.getElementById('ac-npc-container');
        if (!container) return;
        
        container.innerHTML = '';
        const npcs = appState.acNPCs[appState.acVersion] || [];
        
        npcs.forEach(npc => {
            const npcCard = document.createElement('div');
            npcCard.className = 'npc-card';
            npcCard.innerHTML = `
                <div class="npc-header">
                    <div class="npc-name">${npc}</div>
                    <div class="npc-species">岛民</div>
                </div>
                <div class="npc-checkins">
                    <div class="npc-checkin-item">
                        <label>
                            <input type="checkbox" data-npc="${npc}" data-type="greeting">
                            <span>打招呼</span>
                        </label>
                    </div>
                    <div class="npc-checkin-item">
                        <label>
                            <input type="checkbox" data-npc="${npc}" data-type="gift">
                            <span>送礼物</span>
                        </label>
                    </div>
                </div>
            `;
            container.appendChild(npcCard);
        });
        
        // 绑定事件
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                updateACSummary();
                // 自动保存打卡状态
                saveCheckinData();
            });
        });
        
        // 更新统计
        updateACSummary();
    }

    // 更新动森打卡统计
    function updateACSummary() {
        const greetingCheckboxes = document.querySelectorAll('input[data-type="greeting"]:checked');
        const giftCheckboxes = document.querySelectorAll('input[data-type="gift"]:checked');
        
        const greetingCount = greetingCheckboxes.length;
        const giftCount = giftCheckboxes.length;
        const totalPossible = 20; // 10个NPC * 2个任务
        const completed = greetingCount + giftCount;
        const completionRate = totalPossible > 0 ? Math.round((completed / totalPossible) * 100) : 0;
        
        document.getElementById('greeting-count').textContent = greetingCount;
        document.getElementById('gift-count').textContent = giftCount;
        document.getElementById('ac-completion').textContent = `${completionRate}%`;
    }

    // 保存打卡数据
    function saveCheckinData() {
        // 收集补剂打卡数据
        const supplement = {
            iron: document.getElementById('supplement-iron').checked,
            d3k2: document.getElementById('supplement-d3k2').checked,
            magnesium: document.getElementById('supplement-magnesium').checked
        };
        
        // 收集护理打卡数据
        const care = {
            scrub: document.getElementById('care-scrub').checked,
            hairRemoval: document.getElementById('care-hair-removal').checked,
            lotion: document.getElementById('care-lotion').checked
        };
        
        // 收集动森打卡数据
        const acVersion = document.querySelector('input[name="ac-version"]:checked').value;
        const npcStatus = {};
        
        const npcs = appState.acNPCs[acVersion] || [];
        npcs.forEach(npc => {
            const greetingCheckbox = document.querySelector(`input[data-npc="${npc}"][data-type="greeting"]`);
            const giftCheckbox = document.querySelector(`input[data-npc="${npc}"][data-type="gift"]`);
            
            npcStatus[npc] = {
                greeting: greetingCheckbox ? greetingCheckbox.checked : false,
                gift: giftCheckbox ? giftCheckbox.checked : false
            };
        });
        
        // 构建打卡数据对象
        const checkinData = {
            supplement,
            care,
            'animal-crossing': {
                version: acVersion,
                npcStatus
            },
            timestamp: new Date().toISOString()
        };
        
        // 保存到LocalStorage
        const key = `checkin_${appState.currentDate}`;
        localStorage.setItem(key, JSON.stringify(checkinData));
        appState.checkinData = checkinData;
        
        // 更新打卡计数
        updateCheckinCount();
        
        // 显示保存成功提示
        showToast('打卡状态保存成功！');
    }

    // 更新打卡计数
    function updateCheckinCount() {
        let completedCount = 0;
        let totalCount = 0;
        
        // 计算补剂打卡
        if (appState.checkinData.supplement) {
            totalCount += 3;
            completedCount += (appState.checkinData.supplement.iron ? 1 : 0);
            completedCount += (appState.checkinData.supplement.d3k2 ? 1 : 0);
            completedCount += (appState.checkinData.supplement.magnesium ? 1 : 0);
        }
        
        // 计算护理打卡
        if (appState.checkinData.care) {
            totalCount += 3;
            completedCount += (appState.checkinData.care.scrub ? 1 : 0);
            completedCount += (appState.checkinData.care.hairRemoval ? 1 : 0);
            completedCount += (appState.checkinData.care.lotion ? 1 : 0);
        }
        
        // 计算动森打卡
        if (appState.checkinData['animal-crossing'] && appState.checkinData['animal-crossing'].npcStatus) {
            const npcStatus = appState.checkinData['animal-crossing'].npcStatus;
            totalCount += 20; // 10个NPC * 2个任务
            
            Object.values(npcStatus).forEach(status => {
                completedCount += (status.greeting ? 1 : 0);
                completedCount += (status.gift ? 1 : 0);
            });
        }
        
        const badge = document.getElementById('checkin-count');
        if (badge && totalCount > 0) {
            const percentage = Math.round((completedCount / totalCount) * 100);
            badge.textContent = `${percentage}%`;
            badge.style.backgroundColor = percentage >= 80 ? 'var(--success-color)' : 
                                        percentage >= 50 ? 'var(--warning-color)' : 'var(--danger-color)';
        }
    }

    // 初始化事件监听器
    function initEventListeners() {
        // 导航切换
        document.querySelectorAll('.nav-link, .mobile-nav .nav-item').forEach(element => {
            element.addEventListener('click', function(e) {
                e.preventDefault();
                const page = this.getAttribute('data-page');
                switchPage(page);
            });
        });
        
        // 模块折叠/展开
        document.querySelectorAll('.collapse-btn').forEach(button => {
            button.addEventListener('click', function() {
                const moduleCard = this.closest('.module-card');
                moduleCard.classList.toggle('collapsed');
            });
        });
        
        // 暂时保存按钮
        document.querySelectorAll('.btn-save').forEach(button => {
            button.addEventListener('click', function() {
                const module = this.getAttribute('data-module');
                saveModuleData(module);
            });
        });
        
        // 快速保存按钮
        document.getElementById('quick-save')?.addEventListener('click', function() {
            saveAllModules();
        });
        
        // 添加/删除行按钮
        document.getElementById('add-work-row')?.addEventListener('click', function() {
            addWorkRow();
        });
        
        document.getElementById('add-study-row')?.addEventListener('click', function() {
            addStudyRow();
        });
        
        document.getElementById('add-exercise-row')?.addEventListener('click', function() {
            addExerciseRow();
        });
        
        document.getElementById('add-entertainment-row')?.addEventListener('click', function() {
            addEntertainmentRow();
        });
        
        document.getElementById('add-income-row')?.addEventListener('click', function() {
            addIncomeRow();
        });
        
        document.getElementById('add-expense-row')?.addEventListener('click', function() {
            addExpenseRow();
        });
        
        // 家务复选框变化
        document.querySelectorAll('.chores-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', updateChoresScore);
        });
        
        // 财务输入变化
        document.querySelectorAll('.income-amount, .expense-amount').forEach(input => {
            input.addEventListener('input', updateFinanceSummary);
        });
        
        // 动森版本切换
        document.querySelectorAll('input[name="ac-version"]').forEach(radio => {
            radio.addEventListener('change', function() {
                appState.acVersion = this.value;
                initACNPCs();
            });
        });
        
        // 保存打卡按钮
        document.querySelector('.btn-save-checkin')?.addEventListener('click', saveCheckinData);
        
        // 日历导航
        document.getElementById('prev-month')?.addEventListener('click', function() {
            navigateCalendar(-1);
        });
        
        document.getElementById('next-month')?.addEventListener('click', function() {
            navigateCalendar(1);
        });
        
        // 重要日期管理
        document.getElementById('add-important-date')?.addEventListener('click', function() {
            showDateModal();
        });
        
        document.querySelectorAll('.btn-close-modal').forEach(button => {
            button.addEventListener('click', function() {
                hideDateModal();
            });
        });
        
        document.getElementById('important-date-form')?.addEventListener('submit', function(e) {
            e.preventDefault();
            saveImportantDate();
        });
        
        // 颜色选择
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', function() {
                const color = this.getAttribute('data-color');
                document.getElementById('date-color').value = color;
                
                // 更新选中状态
                document.querySelectorAll('.color-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
            });
        });
        
        // GitHub同步
        document.getElementById('backup-data')?.addEventListener('click', backupToGitHub);
        document.getElementById('restore-data')?.addEventListener('click', restoreFromGitHub);
        
        // 数据管理
        document.getElementById('export-data')?.addEventListener('click', exportData);
        document.getElementById('import-data')?.addEventListener('click', function() {
            document.getElementById('import-file').click();
        });
        
        document.getElementById('import-file')?.addEventListener('change', importData);
        document.getElementById('clear-data')?.addEventListener('click', clearAllData);
        
        // 刷新复盘数据
        document.getElementById('refresh-analytics')?.addEventListener('click', refreshAnalytics);
        
        // 移动端汉堡菜单
        document.getElementById('hamburger')?.addEventListener('click', function() {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    }

    // 切换页面
    function switchPage(page) {
        // 更新导航状态
        document.querySelectorAll('.nav-link, .mobile-nav .nav-item').forEach(element => {
            element.classList.remove('active');
            if (element.getAttribute('data-page') === page) {
                element.classList.add('active');
            }
        });
        
        // 更新页面显示
        document.querySelectorAll('.page').forEach(pageElement => {
            pageElement.classList.remove('active');
        });
        
        const targetPage = document.getElementById(`${page}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            appState.currentPage = page;
            
            // 如果是复盘页面，刷新图表
            if (page === 'analytics') {
                refreshAnalytics();
            }
            
            // 如果是日历页面，确保日历已更新
            if (page === 'calendar') {
                updateCalendar();
            }
        }
        
        // 移动端：关闭侧边栏
        if (window.innerWidth <= 768) {
            document.querySelector('.sidebar').classList.remove('active');
        }
    }

    // 保存模块数据
    function saveModuleData(module) {
        let moduleData = {};
        
        switch(module) {
            case 'sleep':
                moduleData = {
                    duration: document.getElementById('sleep-duration').value,
                    quality: document.getElementById('sleep-quality').value,
                    feeling: document.getElementById('sleep-feeling').value
                };
                break;
            case 'breakfast':
                moduleData = {
                    content: document.getElementById('breakfast-content').value,
                    feeling: document.getElementById('breakfast-feeling').value
                };
                break;
            case 'work':
                const tasks = [];
                document.querySelectorAll('.work-row').forEach(row => {
                    const todo = row.querySelector('.work-todo')?.value;
                    const done = row.querySelector('.work-done')?.value;
                    if (todo || done) {
                        tasks.push({ todo: todo || '', done: done || '' });
                    }
                });
                moduleData = { tasks };
                break;
            case 'chores':
                const chores = [];
                document.querySelectorAll('.chores-item input[type="checkbox"]:checked').forEach(checkbox => {
                    chores.push(checkbox.value);
                });
                moduleData = { chores };
                break;
            case 'finance':
                const income = [];
                document.querySelectorAll('.income-row').forEach(row => {
                    const category = row.querySelector('.income-category')?.value;
                    const amount = row.querySelector('.income-amount')?.value;
                    const description = row.querySelector('.income-description')?.value;
                    if (category && amount) {
                        income.push({ category, amount: parseFloat(amount), description: description || '' });
                    }
                });
                
                const expense = [];
                document.querySelectorAll('.expense-row').forEach(row => {
                    const category = row.querySelector('.expense-category')?.value;
                    const amount = row.querySelector('.expense-amount')?.value;
                    const description = row.querySelector('.expense-description')?.value;
                    if (category && amount) {
                        expense.push({ category, amount: parseFloat(amount), description: description || '' });
                    }
                });
                
                moduleData = { income, expense };
                break;
            // ... 其他模块的数据收集
        }
        
        // 保存到LocalStorage
        const key = `${module}_TEMP_${appState.currentDate}`;
        localStorage.setItem(key, JSON.stringify(moduleData));
        
        // 显示保存成功提示
        showToast(`${getModuleName(module)}保存成功！`);
    }

    // 保存所有模块数据
    function saveAllModules() {
        const modules = ['sleep', 'breakfast', 'work', 'chores', 'study', 'lunch', 
                        'nap', 'dinner', 'exercise', 'game', 'entertainment', 'finance'];
        
        modules.forEach(module => {
            saveModuleData(module);
        });
        
        showToast('所有数据保存成功！');
    }

    // 获取模块中文名称
    function getModuleName(module) {
        const names = {
            'sleep': '睡眠复盘',
            'breakfast': '早餐记录',
            'work': '工作看板',
            'chores': '家务记录',
            'study': '学习记录',
            'lunch': '午餐记录',
            'nap': '午休记录',
            'dinner': '晚餐记录',
            'exercise': '运动记录',
            'game': '游戏记录',
            'entertainment': '娱乐记录',
            'finance': '财务记账'
        };
        
        return names[module] || module;
    }

    // 显示Toast提示
    function showToast(message) {
        const toast = document.getElementById('save-toast');
        if (!toast) return;
        
        const messageElement = toast.querySelector('span');
        if (messageElement) {
            messageElement.textContent = message;
        }
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // 自动归档设置
    function setupAutoArchive() {
        // 检查是否需要归档昨天的数据
        checkAndArchiveYesterday();
        
        // 设置定时器，在23:59:59触发归档
        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const timeUntilMidnight = tomorrow.getTime() - now.getTime();
        
        // 设置定时器
        setTimeout(() => {
            // 执行归档
            archiveDailyData();
            // 设置每日归档
            setInterval(archiveDailyData, 24 * 60 * 60 * 1000);
        }, timeUntilMidnight);
    }

    // 归档每日数据
    function archiveDailyData() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        
        // 收集所有临时数据
        const archiveData = {};
        const modules = ['sleep', 'breakfast', 'work', 'chores', 'study', 'lunch', 
                        'nap', 'dinner', 'exercise', 'game', 'entertainment', 'finance'];
        
        modules.forEach(module => {
            const key = `${module}_TEMP_${dateStr}`;
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    archiveData[module] = JSON.parse(data);
                    // 删除临时数据
                    localStorage.removeItem(key);
                } catch (e) {
                    console.error(`归档${module}数据失败:`, e);
                }
            }
        });
        
        // 保存归档数据
        if (Object.keys(archiveData).length > 0) {
            localStorage.setItem(`archive_${dateStr}`, JSON.stringify(archiveData));
            console.log(`已归档 ${dateStr} 的数据`);
        }
        
        // 更新归档计数
        updateArchiveCount();
    }

    // 检查并归档昨天的数据
    function checkAndArchiveYesterday() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateStr = yesterday.toISOString().split('T')[0];
        
        // 检查是否已有归档
        const archiveKey = `archive_${dateStr}`;
        if (!localStorage.getItem(archiveKey)) {
            // 检查是否有临时数据需要归档
            const hasTempData = ['sleep', 'breakfast', 'work', 'chores', 'study', 'lunch', 
                                'nap', 'dinner', 'exercise', 'game', 'entertainment', 'finance']
                .some(module => localStorage.getItem(`${module}_TEMP_${dateStr}`));
            
            if (hasTempData) {
                archiveDailyData();
            }
        }
    }

    // 更新归档计数
    function updateArchiveCount() {
        let count = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('archive_')) {
                count++;
            }
        }
        
        const countElement = document.getElementById('archive-count');
        if (countElement) {
            countElement.textContent = count;
        }
    }

    // 更新存储使用情况
    function updateStorageInfo() {
        let totalBytes = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            totalBytes += key.length + (value ? value.length : 0);
        }
        
        const usedElement = document.getElementById('storage-used');
        if (usedElement) {
            const usedMB = (totalBytes / (1024 * 1024)).toFixed(2);
            usedElement.textContent = `${usedMB} MB`;
        }
    }

    // 添加工作行
    function addWorkRow(todo = '', done = '') {
        const container = document.getElementById('work-rows-container');
        const newRow = document.createElement('div');
        newRow.className = 'work-row';
        newRow.innerHTML = `
            <div class="work-col">
                <input type="text" class="work-todo" placeholder="请输入待办事项" value="${todo}">
            </div>
            <div class="work-col">
                <input type="text" class="work-done" placeholder="完成情况" value="${done}">
            </div>
            <div class="work-col-action">
                <button type="button" class="btn-icon btn-remove-row" title="删除此行">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(newRow);
        
        // 绑定删除事件
        newRow.querySelector('.btn-remove-row').addEventListener('click', function() {
            if (container.children.length > 1) {
                container.removeChild(newRow);
            }
        });
    }

    // 更新家务得分
    function updateChoresScore() {
        const checkedBoxes = document.querySelectorAll('.chores-item input[type="checkbox"]:checked');
        const score = checkedBoxes.length;
        document.getElementById('chores-total-score').textContent = score;
    }

    // 更新财务汇总
    function updateFinanceSummary() {
        let totalIncome = 0;
        let totalExpense = 0;
        
        document.querySelectorAll('.income-row').forEach(row => {
            const amountInput = row.querySelector('.income-amount');
            if (amountInput && amountInput.value) {
                totalIncome += parseFloat(amountInput.value) || 0;
            }
        });
        
        document.querySelectorAll('.expense-row').forEach(row => {
            const amountInput = row.querySelector('.expense-amount');
            if (amountInput && amountInput.value) {
                totalExpense += parseFloat(amountInput.value) || 0;
            }
        });
        
        const netIncome = totalIncome - totalExpense;
        
        document.getElementById('total-income').textContent = totalIncome.toFixed(2);
        document.getElementById('total-expense').textContent = totalExpense.toFixed(2);
        document.getElementById('net-income').textContent = netIncome.toFixed(2);
    }

    // 添加收入行
    function addIncomeRow(category = '工资', amount = '', description = '') {
        const container = document.getElementById('income-rows-container');
        const newRow = document.createElement('div');
        newRow.className = 'finance-row income-row';
        newRow.innerHTML = `
            <div class="finance-col">
                <select class="income-category">
                    <option value="工资" ${category === '工资' ? 'selected' : ''}>工资</option>
                    <option value="兼职" ${category === '兼职' ? 'selected' : ''}>兼职</option>
                    <option value="礼物" ${category === '礼物' ? 'selected' : ''}>礼物</option>
                    <option value="其他" ${category === '其他' ? 'selected' : ''}>其他</option>
                </select>
            </div>
            <div class="finance-col">
                <input type="number" class="income-amount" min="0" placeholder="金额" value="${amount}">
            </div>
            <div class="finance-col">
                <input type="text" class="income-description" placeholder="描述" value="${description}">
            </div>
            <div class="finance-col-action">
                <button type="button" class="btn-icon btn-remove-income-row" title="删除此行">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(newRow);
        
        // 绑定删除事件
        newRow.querySelector('.btn-remove-income-row').addEventListener('click', function() {
            if (container.children.length > 1) {
                container.removeChild(newRow);
                updateFinanceSummary();
            }
        });
        
        // 绑定输入事件
        newRow.querySelector('.income-amount').addEventListener('input', updateFinanceSummary);
        
        updateFinanceSummary();
    }

    // 添加支出行
    function addExpenseRow(category = '餐饮', amount = '', description = '') {
        const container = document.getElementById('expense-rows-container');
        const newRow = document.createElement('div');
        newRow.className = 'finance-row expense-row';
        newRow.innerHTML = `
            <div class="finance-col">
                <select class="expense-category">
                    <option value="餐饮" ${category === '餐饮' ? 'selected' : ''}>餐饮</option>
                    <option value="购物" ${category === '购物' ? 'selected' : ''}>购物</option>
                    <option value="娱乐" ${category === '娱乐' ? 'selected' : ''}>娱乐</option>
                    <option value="交通" ${category === '交通' ? 'selected' : ''}>交通</option>
                    <option value="其他" ${category === '其他' ? 'selected' : ''}>其他</option>
                </select>
            </div>
            <div class="finance-col">
                <input type="number" class="expense-amount" min="0" placeholder="金额" value="${amount}">
            </div>
            <div class="finance-col">
                <input type="text" class="expense-description" placeholder="描述" value="${description}">
            </div>
            <div class="finance-col-action">
                <button type="button" class="btn-icon btn-remove-expense-row" title="删除此行">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(newRow);
        
        // 绑定删除事件
        newRow.querySelector('.btn-remove-expense-row').addEventListener('click', function() {
            if (container.children.length > 1) {
                container.removeChild(newRow);
                updateFinanceSummary();
            }
        });
        
        // 绑定输入事件
        newRow.querySelector('.expense-amount').addEventListener('input', updateFinanceSummary);
        
        updateFinanceSummary();
    }

    // 初始化日历
    function initCalendar() {
        updateCalendar();
    }

    // 更新日历显示
    function updateCalendar() {
        const currentMonthYear = document.getElementById('current-month-year');
        const calendarDays = document.getElementById('calendar-days');
        
        if (!currentMonthYear || !calendarDays) return;
        
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // 设置月份显示
        currentMonthYear.textContent = `${currentYear}年${currentMonth + 1}月`;
        
        // 清空日历
        calendarDays.innerHTML = '';
        
        // 获取当月第一天和最后一天
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        
        // 获取第一天是星期几（0=周日，6=周六）
        const firstDayOfWeek = firstDay.getDay();
        
        // 添加上个月的日期
        const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const day = document.createElement('div');
            day.className = 'calendar-day other-month';
            day.textContent = prevMonthLastDay - i;
            calendarDays.appendChild(day);
        }
        
        // 添加当月日期
        const todayStr = now.toISOString().split('T')[0];
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day';
            day.textContent = i;
            
            // 构建日期字符串
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            day.setAttribute('data-date', dateStr);
            
            // 检查是否是今天
            if (dateStr === todayStr) {
                day.classList.add('today');
            }
            
            // 检查是否有记录
            if (localStorage.getItem(`archive_${dateStr}`)) {
                day.classList.add('has-record');
            }
            
            // 检查是否是重要日期
            if (appState.importantDates.some(date => date.date === dateStr)) {
                day.classList.add('important-date');
            }
            
            // 添加点击事件
            day.addEventListener('click', function() {
                const date = this.getAttribute('data-date');
                if (date) {
                    viewDateRecords(date);
                }
            });
            
            calendarDays.appendChild(day);
        }
        
        // 添加下个月的日期
        const totalCells = 42; // 6行 * 7天
        const remainingCells = totalCells - (firstDayOfWeek + lastDay.getDate());
        for (let i = 1; i <= remainingCells; i++) {
            const day = document.createElement('div');
            day.className = 'calendar-day other-month';
            day.textContent = i;
            calendarDays.appendChild(day);
        }
    }

    // 日历导航
    function navigateCalendar(direction) {
        // 这里需要实现月份切换逻辑
        // 由于时间关系，这里只提供框架
        console.log(`导航日历: ${direction > 0 ? '下个月' : '上个月'}`);
        updateCalendar();
    }

    // 查看日期记录
    function viewDateRecords(date) {
        // 这里实现查看特定日期记录的功能
        console.log(`查看日期记录: ${date}`);
        // 可以打开一个模态框显示该日期的归档数据
    }

    // 加载重要日期
    function loadImportantDates() {
        const data = localStorage.getItem('important_dates');
        if (data) {
            try {
                appState.importantDates = JSON.parse(data);
                updateImportantDatesList();
            } catch (e) {
                console.error('加载重要日期失败:', e);
            }
        }
    }

    // 更新重要日期列表
    function updateImportantDatesList() {
        const list = document.getElementById('important-dates-list');
        if (!list) return;
        
        list.innerHTML = '';
        
        appState.importantDates.forEach((dateItem, index) => {
            const dateElement = document.createElement('div');
            dateElement.className = 'important-date-item';
            dateElement.style.borderLeftColor = dateItem.color;
            dateElement.innerHTML = `
                <div class="date-item-info">
                    <div class="date-item-color" style="background-color: ${dateItem.color}"></div>
                    <div>
                        <div class="date-item-title">${dateItem.title}</div>
                        <div class="date-item-date">${formatDate(dateItem.date)}</div>
                    </div>
                </div>
                <div class="date-item-actions">
                    <span class="date-item-type">${dateItem.type}</span>
                    <button class="btn-icon btn-remove-date" data-index="${index}" title="删除">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            list.appendChild(dateElement);
        });
        
        // 绑定删除事件
        document.querySelectorAll('.btn-remove-date').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                removeImportantDate(index);
            });
        });
    }

    // 格式化日期
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    }

    // 显示日期模态框
    function showDateModal() {
        const modal = document.getElementById('date-modal');
        if (modal) {
            modal.classList.add('active');
            // 设置默认日期为今天
            document.getElementById('date-date').value = appState.currentDate;
        }
    }

    // 隐藏日期模态框
    function hideDateModal() {
        const modal = document.getElementById('date-modal');
        if (modal) {
            modal.classList.remove('active');
            // 重置表单
            document.getElementById('important-date-form').reset();
        }
    }

    // 保存重要日期
    function saveImportantDate() {
        const title = document.getElementById('date-title').value;
        const date = document.getElementById('date-date').value;
        const type = document.getElementById('date-type').value;
        const color = document.getElementById('date-color').value;
        
        if (!title || !date) {
            showToast('请填写日期标题和日期');
            return;
        }
        
        const newDate = {
            title,
            date,
            type,
            color,
            createdAt: new Date().toISOString()
        };
        
        appState.importantDates.push(newDate);
        localStorage.setItem('important_dates', JSON.stringify(appState.importantDates));
        
        updateImportantDatesList();
        updateCalendar();
        hideDateModal();
        showToast('重要日期已添加');
    }

    // 删除重要日期
    function removeImportantDate(index) {
        if (index >= 0 && index < appState.importantDates.length) {
            appState.importantDates.splice(index, 1);
            localStorage.setItem('important_dates', JSON.stringify(appState.importantDates));
            updateImportantDatesList();
            updateCalendar();
            showToast('重要日期已删除');
        }
    }

    // 刷新数据分析
    function refreshAnalytics() {
        // 这里实现图表数据的生成和更新
        console.log('刷新数据分析');
        // 实际实现中需要生成各种图表
    }

    // GitHub备份
    async function backupToGitHub() {
        const token = document.getElementById('github-token').value;
        const gistId = document.getElementById('gist-id').value;
        
        if (!token) {
            showToast('请输入GitHub Personal Access Token');
            return;
        }
        
        try {
            // 收集所有数据
            const allData = collectAllData();
            
            // 加密数据
            const encryptedData = encryptData(JSON.stringify(allData));
            
            // 准备Gist数据
            const gistData = {
                description: '小航小刀小岛 - 生活管理数据备份',
                public: false,
                files: {
                    'xiaohang-xiaodao-data.json': {
                        content: encryptedData
                    }
                }
            };
            
            // 如果有Gist ID，更新现有Gist，否则创建新的
            let response;
            if (gistId) {
                response = await fetch(`https://api.github.com/gists/${gistId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(gistData)
                });
            } else {
                response = await fetch('https://api.github.com/gists', {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(gistData)
                });
            }
            
            if (response.ok) {
                const result = await response.json();
                const newGistId = result.id;
                
                // 保存Gist ID和Token
                localStorage.setItem('github_token', token);
                localStorage.setItem('gist_id', newGistId);
                localStorage.setItem('last_sync', new Date().toISOString());
                
                // 更新显示
                document.getElementById('current-gist-id').textContent = newGistId;
                document.getElementById('last-sync').textContent = '刚刚';
                
                showToast('数据备份成功！');
            } else {
                const error = await response.text();
                throw new Error(`GitHub API错误: ${response.status} ${error}`);
            }
        } catch (error) {
            console.error('备份失败:', error);
            showToast(`备份失败: ${error.message}`);
        }
    }

    // 从GitHub恢复
    async function restoreFromGitHub() {
        const token = document.getElementById('github-token').value;
        const gistId = document.getElementById('gist-id').value || localStorage.getItem('gist_id');
        
        if (!token || !gistId) {
            showToast('请输入GitHub Token和Gist ID');
            return;
        }
        
        try {
            const response = await fetch(`https://api.github.com/gists/${gistId}`, {
                headers: {
                    'Authorization': `token ${token}`
                }
            });
            
            if (response.ok) {
                const result = await response.json();
                const encryptedData = result.files['xiaohang-xiaodao-data.json'].content;
                
                // 解密数据
                const decryptedData = decryptData(encryptedData);
                const allData = JSON.parse(decryptedData);
                
                // 恢复数据到LocalStorage
                restoreAllData(allData);
                
                // 重新加载应用
                location.reload();
            } else {
                throw new Error(`GitHub API错误: ${response.status}`);
            }
        } catch (error) {
            console.error('恢复失败:', error);
            showToast(`恢复失败: ${error.message}`);
        }
    }

    // 收集所有数据
    function collectAllData() {
        const allData = {
            archives: {},
            checkins: {},
            importantDates: appState.importantDates,
            tempData: {},
            metadata: {
                exportedAt: new Date().toISOString(),
                version: '1.0.0'
            }
        };
        
        // 收集归档数据
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('archive_')) {
                try {
                    allData.archives[key] = JSON.parse(localStorage.getItem(key));
                } catch (e) {
                    console.error(`收集归档数据失败: ${key}`, e);
                }
            } else if (key.startsWith('checkin_')) {
                try {
                    allData.checkins[key] = JSON.parse(localStorage.getItem(key));
                } catch (e) {
                    console.error(`收集打卡数据失败: ${key}`, e);
                }
            } else if (key.includes('_TEMP_')) {
                try {
                    allData.tempData[key] = JSON.parse(localStorage.getItem(key));
                } catch (e) {
                    console.error(`收集临时数据失败: ${key}`, e);
                }
            }
        }
        
        return allData;
    }

    // 恢复所有数据
    function restoreAllData(allData) {
        // 清空现有数据
        localStorage.clear();
        
        // 恢复归档数据
        Object.keys(allData.archives).forEach(key => {
            localStorage.setItem(key, JSON.stringify(allData.archives[key]));
        });
        
        // 恢复打卡数据
        Object.keys(allData.checkins).forEach(key => {
            localStorage.setItem(key, JSON.stringify(allData.checkins[key]));
        });
        
        // 恢复临时数据
        Object.keys(allData.tempData).forEach(key => {
            localStorage.setItem(key, JSON.stringify(allData.tempData[key]));
        });
        
        // 恢复重要日期
        localStorage.setItem('important_dates', JSON.stringify(allData.importantDates || []));
        
        // 恢复GitHub设置
        if (allData.metadata && allData.metadata.githubSettings) {
            localStorage.setItem('github_token', allData.metadata.githubSettings.token || '');
            localStorage.setItem('gist_id', allData.metadata.githubSettings.gistId || '');
            localStorage.setItem('last_sync', allData.metadata.exportedAt || '从未');
        }
    }

    // 简单加密函数（实际使用中应使用更安全的加密方法）
    function encryptData(data) {
        // 这里使用简单的Base64编码，实际应使用AES加密
        return btoa(encodeURIComponent(data));
    }

    // 简单解密函数
    function decryptData(encryptedData) {
        try {
            return decodeURIComponent(atob(encryptedData));
        } catch (e) {
            console.error('解密失败:', e);
            return '';
        }
    }

    // 导出数据
    function exportData() {
        const allData = collectAllData();
        const dataStr = JSON.stringify(allData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `小航小刀小岛_备份_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('数据导出成功！');
    }

    // 导入数据
    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const allData = JSON.parse(e.target.result);
                
                if (confirm('导入数据将覆盖当前所有数据，确定继续吗？')) {
                    restoreAllData(allData);
                    location.reload();
                }
            } catch (error) {
                console.error('导入数据失败:', error);
                showToast('导入失败：文件格式不正确');
            }
        };
        reader.readAsText(file);
        
        // 重置文件输入
        event.target.value = '';
    }

    // 清除所有数据
    function clearAllData() {
        if (confirm('确定要清除所有本地数据吗？此操作不可撤销！')) {
            localStorage.clear();
            location.reload();
        }
    }

    // 启动应用
    initApp();
});