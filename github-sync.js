/**
 * GitHub 同步管理器
 * 使用 Personal Access Token (PAT) 进行同步
 */

class GitHubSyncManager {
    constructor() {
        this.pat = null;
        this.gistId = null;
        this.username = null;
        this.userInfo = {};
        this.lastSync = null;
        this.isAutoSync = false;
        this.syncInterval = null;
        
        // 初始化
        this.init();
    }
    
    init() {
        this.loadConfig();
        
        // 监听页面可见性变化，用于自动同步
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.isAutoSync) {
                this.autoSyncIfNeeded();
            }
        });
        
        // 监听存储变化
        window.addEventListener('storage', (e) => {
            if (e.key && !e.key.includes('github_') && this.isAutoSync) {
                this.queueAutoSync();
            }
        });
    }
    
    loadConfig() {
        this.pat = localStorage.getItem('github_pat');
        this.gistId = localStorage.getItem('github_gist_id');
        this.username = localStorage.getItem('github_username');
        this.lastSync = localStorage.getItem('github_last_sync');
        this.isAutoSync = localStorage.getItem('github_auto_sync') === 'true';
        
        const userInfo = localStorage.getItem('github_user_info');
        if (userInfo) {
            try {
                this.userInfo = JSON.parse(userInfo);
            } catch (e) {
                console.error('解析用户信息失败:', e);
                this.userInfo = {};
            }
        }
    }
    
    saveConfig() {
        if (this.pat) localStorage.setItem('github_pat', this.pat);
        if (this.gistId) localStorage.setItem('github_gist_id', this.gistId);
        if (this.username) localStorage.setItem('github_username', this.username);
        if (this.lastSync) localStorage.setItem('github_last_sync', this.lastSync);
        localStorage.setItem('github_user_info', JSON.stringify(this.userInfo));
        localStorage.setItem('github_auto_sync', this.isAutoSync.toString());
    }
    
    clearConfig() {
        localStorage.removeItem('github_pat');
        localStorage.removeItem('github_gist_id');
        localStorage.removeItem('github_username');
        localStorage.removeItem('github_last_sync');
        localStorage.removeItem('github_user_info');
        localStorage.removeItem('github_auto_sync');
        
        this.pat = null;
        this.gistId = null;
        this.username = null;
        this.userInfo = {};
        this.lastSync = null;
        this.isAutoSync = false;
        
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }
    
    isConnected() {
        return !!this.pat;
    }
    
    async testConnection() {
        if (!this.pat) {
            throw new Error('未配置 PAT');
        }
        
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${this.pat}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('PAT 无效或已过期');
                }
                throw new Error(`GitHub API 错误: ${response.status}`);
            }
            
            const userData = await response.json();
            this.username = userData.login;
            this.userInfo = {
                name: userData.name || userData.login,
                avatar_url: userData.avatar_url,
                id: userData.id,
                html_url: userData.html_url
            };
            
            return userData;
        } catch (error) {
            console.error('连接测试失败:', error);
            throw error;
        }
    }
    
    async findOrCreateGist(description = 'island sync data') {
        if (!this.pat) {
            throw new Error('未配置 PAT');
        }
        
        try {
            // 如果已有 gistId，验证它是否存在
            if (this.gistId) {
                try {
                    const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                        headers: {
                            'Authorization': `token ${this.pat}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });
                    
                    if (response.ok) {
                        const gist = await response.json();
                        return gist;
                    }
                } catch (e) {
                    console.warn('现有 Gist 验证失败，将重新查找:', e);
                }
            }
            
            // 查找现有的 island Gist
            const response = await fetch('https://api.github.com/gists', {
                headers: {
                    'Authorization': `token ${this.pat}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`获取 Gist 列表失败: ${response.status}`);
            }
            
            const gists = await response.json();
            const islandGists = gists.filter(gist => 
                gist.description && gist.description.includes('island')
            );
            
            if (islandGists.length > 0) {
                // 使用最新的 island Gist
                islandGists.sort((a, b) => 
                    new Date(b.updated_at) - new Date(a.updated_at)
                );
                this.gistId = islandGists[0].id;
                return islandGists[0];
            } else {
                // 创建新的 Gist
                const createResponse = await fetch('https://api.github.com/gists', {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${this.pat}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        description: description,
                        public: false,
                        files: {
                            'island-data.json': {
                                content: JSON.stringify({
                                    created: new Date().toISOString(),
                                    version: '1.0',
                                    device: this.getDeviceId()
                                })
                            }
                        }
                    })
                });
                
                if (!createResponse.ok) {
                    throw new Error(`创建 Gist 失败: ${createResponse.status}`);
                }
                
                const newGist = await createResponse.json();
                this.gistId = newGist.id;
                return newGist;
            }
        } catch (error) {
            console.error('Gist 操作失败:', error);
            throw error;
        }
    }
    
    getDeviceId() {
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = 'device-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('device_id', deviceId);
        }
        return deviceId;
    }
    
    collectAllData() {
        const allData = {
            _metadata: {
                syncTime: new Date().toISOString(),
                deviceId: this.getDeviceId(),
                version: '1.0'
            },
            records: {}
        };
        
        // 收集所有应用数据
        const storageKeys = Object.keys(localStorage);
        
        storageKeys.forEach(key => {
            // 排除同步相关和临时数据
            if (!key.includes('github_') && 
                !key.includes('_temp') && 
                !key.includes('_TEMP') &&
                key !== 'device_id') {
                try {
                    const value = localStorage.getItem(key);
                    if (value) {
                        allData.records[key] = JSON.parse(value);
                    }
                } catch (e) {
                    console.warn(`无法解析 ${key}:`, e);
                }
            }
        });
        
        return allData;
    }
    
    encryptData(data) {
        // 简单的混淆加密（生产环境应该使用更安全的方法）
        const jsonStr = JSON.stringify(data);
        // Base64 编码
        const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
        // 添加版本标记
        return `island-v1:${base64}`;
    }
    
    decryptData(encrypted) {
        try {
            if (!encrypted.startsWith('island-v1:')) {
                throw new Error('无效的数据格式');
            }
            
            const base64 = encrypted.substring(10);
            const jsonStr = decodeURIComponent(escape(atob(base64)));
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error('数据解密失败:', error);
            throw new Error('数据解密失败');
        }
    }
    
    async uploadData() {
        if (!this.isConnected()) {
            throw new Error('请先连接 GitHub');
        }
        
        if (!this.gistId) {
            await this.findOrCreateGist();
        }
        
        // 收集数据
        const allData = this.collectAllData();
        
        // 加密数据
        const encryptedData = this.encryptData(allData);
        
        // 更新 Gist
        const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${this.pat}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                description: `island sync data - ${new Date().toLocaleString('zh-CN')}`,
                files: {
                    'island-data.json': {
                        content: encryptedData
                    }
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`上传失败: ${response.status}`);
        }
        
        this.lastSync = new Date().toISOString();
        this.saveConfig();
        
        return true;
    }
    
    async downloadData() {
        if (!this.isConnected()) {
            throw new Error('请先连接 GitHub');
        }
        
        if (!this.gistId) {
            throw new Error('未找到 Gist，请先上传数据');
        }
        
        // 获取 Gist 数据
        const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
            headers: {
                'Authorization': `token ${this.pat}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Gist 不存在，可能已被删除');
            }
            throw new Error(`下载失败: ${response.status}`);
        }
        
        const gistData = await response.json();
        const encryptedContent = gistData.files['island-data.json'].content;
        
        // 解密数据
        const remoteData = this.decryptData(encryptedContent);
        
        // 合并数据（保留本地未冲突的数据）
        this.mergeData(remoteData);
        
        this.lastSync = new Date().toISOString();
        this.saveConfig();
        
        return true;
    }
    
    mergeData(remoteData) {
        const localData = this.collectAllData();
        const merged = {};
        
        // 处理每条记录
        if (remoteData.records) {
            Object.keys(remoteData.records).forEach(key => {
                const remoteRecords = remoteData.records[key];
                const localRecords = localData.records[key];
                
                if (!localRecords) {
                    // 本地没有，直接使用远程
                    merged[key] = remoteRecords;
                } else {
                    // 合并逻辑：以日期为单位合并
                    if (typeof remoteRecords === 'object' && remoteRecords !== null) {
                        merged[key] = { ...localRecords };
                        
                        Object.keys(remoteRecords).forEach(date => {
                            if (!merged[key][date]) {
                                // 本地没有该日期的数据，使用远程
                                merged[key][date] = remoteRecords[date];
                            } else {
                                // 合并同一天的数据
                                const localDay = Array.isArray(localRecords[date]) ? localRecords[date] : [];
                                const remoteDay = Array.isArray(remoteRecords[date]) ? remoteRecords[date] : [];
                                
                                // 简单合并，避免重复
                                const combined = [...localDay];
                                const seenTimestamps = new Set(
                                    localDay.map(r => r.timestamp || r.date || '')
                                );
                                
                                remoteDay.forEach(record => {
                                    const timestamp = record.timestamp || record.date || '';
                                    if (!seenTimestamps.has(timestamp)) {
                                        combined.push(record);
                                        seenTimestamps.add(timestamp);
                                    }
                                });
                                
                                merged[key][date] = combined;
                            }
                        });
                    } else {
                        // 非对象数据，使用远程（如果本地没有）
                        merged[key] = remoteRecords;
                    }
                }
            });
        }
        
        // 保存合并后的数据
        Object.keys(merged).forEach(key => {
            try {
                localStorage.setItem(key, JSON.stringify(merged[key]));
            } catch (e) {
                console.error(`保存 ${key} 失败:`, e);
            }
        });
        
        return merged;
    }
    
    async sync(operation = 'auto') {
        try {
            if (!this.isConnected()) {
                return { success: false, message: '未连接 GitHub' };
            }
            
            let result;
            
            if (operation === 'upload' || operation === 'auto') {
                result = await this.uploadData();
                return { 
                    success: true, 
                    message: '数据上传成功',
                    operation: 'upload',
                    time: this.lastSync
                };
            } else if (operation === 'download') {
                result = await this.downloadData();
                return { 
                    success: true, 
                    message: '数据下载成功',
                    operation: 'download',
                    time: this.lastSync
                };
            }
        } catch (error) {
            console.error('同步失败:', error);
            return { 
                success: false, 
                message: error.message,
                operation: operation
            };
        }
    }
    
    setAutoSync(enabled, intervalMinutes = 30) {
        this.isAutoSync = enabled;
        this.saveConfig();
        
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        
        if (enabled) {
            this.syncInterval = setInterval(() => {
                this.autoSyncIfNeeded();
            }, intervalMinutes * 60 * 1000);
            
            // 页面显示时也检查
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    this.autoSyncIfNeeded();
                }
            });
        }
    }
    
    async autoSyncIfNeeded() {
        if (!this.isConnected() || !this.isAutoSync) {
            return;
        }
        
        // 检查是否需要同步（例如：距离上次同步超过30分钟）
        const lastSyncTime = this.lastSync ? new Date(this.lastSync) : null;
        const now = new Date();
        
        if (!lastSyncTime || (now - lastSyncTime) > 30 * 60 * 1000) {
            try {
                await this.sync('auto');
                console.log('自动同步完成');
            } catch (error) {
                console.warn('自动同步失败:', error);
            }
        }
    }
    
    queueAutoSync() {
        if (!this.isAutoSync) return;
        
        // 防抖处理，避免频繁同步
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
        }
        
        this.syncTimeout = setTimeout(() => {
            this.autoSyncIfNeeded();
        }, 5000); // 5秒后执行
    }
    
    getSyncInfo() {
        return {
            connected: this.isConnected(),
            username: this.username,
            gistId: this.gistId,
            lastSync: this.lastSync,
            autoSync: this.isAutoSync,
            userInfo: this.userInfo
        };
    }
    
    async validateAndRepair() {
        if (!this.isConnected()) {
            return { valid: false, message: '未连接' };
        }
        
        try {
            // 测试 PAT 有效性
            await this.testConnection();
            
            // 测试 Gist 访问
            if (this.gistId) {
                const response = await fetch(`https://api.github.com/gists/${this.gistId}`, {
                    headers: {
                        'Authorization': `token ${this.pat}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (!response.ok) {
                    // Gist 可能不存在，尝试重新创建
                    await this.findOrCreateGist();
                    return { 
                        valid: true, 
                        repaired: true, 
                        message: 'Gist 已重新创建' 
                    };
                }
            }
            
            return { valid: true, message: '配置正常' };
        } catch (error) {
            return { 
                valid: false, 
                message: `配置错误: ${error.message}` 
            };
        }
    }
}

// 创建全局实例
const gitHubSync = new GitHubSyncManager();

// 导出到全局
window.gitHubSync = gitHubSync;

// 简化的事件监听器，用于页面集成
document.addEventListener('DOMContentLoaded', function() {
    // 可以在这里添加一些初始化逻辑
    console.log('GitHub Sync Manager 已加载');
    
    // 检查并显示同步状态
    const syncInfo = gitHubSync.getSyncInfo();
    if (syncInfo.connected) {
        console.log(`已连接 GitHub: ${syncInfo.username}`);
        if (syncInfo.lastSync) {
            console.log(`上次同步: ${new Date(syncInfo.lastSync).toLocaleString()}`);
        }
    }
});

// 工具函数
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function showSyncNotification(message, type = 'info') {
    // 这里可以集成到您的通知系统
    console.log(`[GitHub Sync] ${message}`);
    
    if (window.showNotification && typeof window.showNotification === 'function') {
        window.showNotification(message, type);
    }
}

// 辅助函数：获取数据统计
function getDataStats() {
    const stats = {
        totalRecords: 0,
        totalSize: 0,
        categories: {}
    };
    
    const storageKeys = Object.keys(localStorage);
    
    storageKeys.forEach(key => {
        if (!key.includes('github_') && 
            !key.includes('_temp') && 
            !key.includes('_TEMP')) {
            try {
                const value = localStorage.getItem(key);
                if (value) {
                    const data = JSON.parse(value);
                    const size = new Blob([value]).size;
                    
                    stats.totalSize += size;
                    
                    if (typeof data === 'object') {
                        let recordCount = 0;
                        
                        if (Array.isArray(data)) {
                            recordCount = data.length;
                        } else {
                            // 计算对象中的记录数
                            Object.values(data).forEach(item => {
                                if (Array.isArray(item)) {
                                    recordCount += item.length;
                                } else {
                                    recordCount++;
                                }
                            });
                        }
                        
                        stats.totalRecords += recordCount;
                        stats.categories[key] = {
                            records: recordCount,
                            size: formatBytes(size)
                        };
                    }
                }
            } catch (e) {
                console.warn(`统计 ${key} 失败:`, e);
            }
        }
    });
    
    stats.totalSizeFormatted = formatBytes(stats.totalSize);
    return stats;
}

// 导出工具函数
window.gitHubSyncUtils = {
    formatBytes,
    showSyncNotification,
    getDataStats
};
// 等待 DOM 加载完成后初始化 GitHub 同步
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 GitHub 同步模块初始化...');
    
    // 如果 githubSyncManager 存在，则初始化
    if (typeof githubSyncManager !== 'undefined' && githubSyncManager) {
        githubSyncManager.init();
        console.log('✅ GitHub 同步模块初始化完成');
    } else {
        console.warn('⚠️ GitHub 同步管理器未找到');
    }
    
    // 确保 UI 控制函数可用
    if (typeof showNotification === 'undefined') {
        window.showNotification = function(message) {
            console.log('📢 通知:', message);
            alert(message); // 备用方案
        };
    }
});