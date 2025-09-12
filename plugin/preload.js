console.log("preload.js loaded")

const otpCode = require('./otp_code');
const fs = require('fs');
// 动态按需加载 ESM 包 webdav（CommonJS 中无法直接 require）
let __webdavModule = null;
async function importWebDav() {
    if (__webdavModule) return __webdavModule;
    try {
        __webdavModule = await import('webdav');
        return __webdavModule;
    } catch (e) {
        throw new Error('加载 WebDAV 模块失败: ' + (e && e.message ? e.message : String(e)));
    }
}

const DB_KEY_OTP_ITEMS = 'otp_items';
const DB_KEY_DELETED_ITEMS = 'deleted_otp_items';
const DB_KEY_WEBDAV_CONFIG = 'webdav_config';
const DB_KEY_AUTO_BACKUP_CONFIG = 'auto_backup_config';
const db = utools.dbCryptoStorage || utools.dbStorage;





window.api = {

    otp: {
        generateTOTP: otpCode.generateTOTP,
        generateNextTOTP: otpCode.generateNextTOTP,
        getOtpItems,
        saveOtpItem,
        deleteOtpItem,
        updateOtpItem,
        copyToClipboard,
        parseOtpUri,
        importOtpUri,
        importOtpTextFile,
        importOtpFromFile,
        exportOtpToFile,
        generateOtpUri,
        getDeletedItems,
        restoreDeletedItem,
        permanentDeleteItem,
        // WebDAV 备份相关 API
        getWebDavConfig,
        saveWebDavConfig,
        testWebDavConnection,
        webdavBackup,
        webdavRestore,
        // 自动备份相关 API
        getAutoBackupConfig,
        setAutoBackupEnabled
    }
}




// 获取所有OTP项目
function getOtpItems() {
    if(db === utools.dbCryptoStorage){
        const data = utools.dbStorage.getItem(DB_KEY_OTP_ITEMS)
        if(data && data.length > 0){
            db.setItem(DB_KEY_OTP_ITEMS, data)
            utools.dbStorage.removeItem(DB_KEY_OTP_ITEMS)
            return data
        }
    }
    const otpItems = db.getItem(DB_KEY_OTP_ITEMS) || [];
    return otpItems;
}

// 保存OTP项目
function saveOtpItem(item) {
    if (!item.id) {
        item.id = crypto.randomUUID().toString();
    }
    
    const otpItems = getOtpItems();
    otpItems.push(item);
    db.setItem(DB_KEY_OTP_ITEMS, otpItems);
    
    // 触发自动备份
    setTimeout(() => triggerAutoBackupIfEnabled(), 100);
    
    return item;
}

// 更新OTP项目
function updateOtpItem(item) {
    const otpItems = getOtpItems();
    const index = otpItems.findIndex(i => i.id === item.id);
    if (index !== -1) {
        otpItems[index] = item;
        db.setItem(DB_KEY_OTP_ITEMS, otpItems);
        
        // 触发自动备份
        setTimeout(() => triggerAutoBackupIfEnabled(), 100);
        
        return true;
    }
    return false;
}

// 删除OTP项目（移动到已删除列表）
function deleteOtpItem(id) {
    const otpItems = getOtpItems();
    const index = otpItems.findIndex(i => i.id === id);
    if (index !== -1) {
        // 获取要删除的项目
        const deletedItem = { ...otpItems[index], deletedAt: new Date().toISOString() };
        
        // 从活跃列表中移除
        otpItems.splice(index, 1);
        db.setItem(DB_KEY_OTP_ITEMS, otpItems);
        
        // 添加到已删除列表
        const deletedItems = getDeletedItems();
        deletedItems.push(deletedItem);
        db.setItem(DB_KEY_DELETED_ITEMS, deletedItems);
        
        // 触发自动备份
        setTimeout(() => triggerAutoBackupIfEnabled(), 100);
        
        return true;
    }
    return false;
}

// 获取已删除的OTP项目
function getDeletedItems() {
    const deletedItems = db.getItem(DB_KEY_DELETED_ITEMS) || [];
    return deletedItems;
}

// 恢复已删除的OTP项目
function restoreDeletedItem(id) {
    const deletedItems = getDeletedItems();
    const index = deletedItems.findIndex(i => i.id === id);
    if (index !== -1) {
        // 获取要恢复的项目
        const restoredItem = { ...deletedItems[index] };
        delete restoredItem.deletedAt; // 移除删除时间戳
        
        // 从已删除列表中移除
        deletedItems.splice(index, 1);
        db.setItem(DB_KEY_DELETED_ITEMS, deletedItems);
        
        // 添加回活跃列表
        const otpItems = getOtpItems();
        otpItems.push(restoredItem);
        db.setItem(DB_KEY_OTP_ITEMS, otpItems);
        
        // 触发自动备份
        setTimeout(() => triggerAutoBackupIfEnabled(), 100);
        
        return true;
    }
    return false;
}

// 永久删除OTP项目
function permanentDeleteItem(id) {
    const deletedItems = getDeletedItems();
    const index = deletedItems.findIndex(i => i.id === id);
    if (index !== -1) {
        deletedItems.splice(index, 1);
        db.setItem(DB_KEY_DELETED_ITEMS, deletedItems);
        return true;
    }
    return false;
}



// 复制文本到剪贴板
function copyToClipboard(text) {
    utools.copyText(text);
}

// 解析OTP URI (otpauth://...)
function parseOtpUri(uri) {
    try {
        if (!uri.startsWith('otpauth://')) {
            throw new Error('不是有效的OTP URI');
        }
        
        // 安全地解析 URI
        // 首先提取基本部分：协议、路径和查询部分
        const uriMatch = uri.match(/^(otpauth:\/\/[^\/]+)\/([^?]+)(\?.+)?$/);
        if (!uriMatch) {
            throw new Error('URI 格式不正确');
        }
        
        const [, protocolPart, pathPart, queryPart = ''] = uriMatch;
        
        // 解析类型 (totp/hotp)
        const type = protocolPart.replace('otpauth://', '');
        if (type !== 'totp' && type !== 'hotp') {
            throw new Error('不支持的 OTP 类型');
        }
        
        // 解析账户信息 (手动解码路径部分)
        const decodedPath = decodeURIComponent(pathPart);
        const segments = decodedPath.split(':');
        
        let issuer = '';
        let name = decodedPath;
        
        if (segments.length > 1) {
            issuer = segments[0].trim();
            name = segments[1].trim();
        }
        
        // 手动解析查询参数，避免 URL 对象在处理特殊查询参数时的问题
        const params = new Map();
        if (queryPart) {
            // 移除开头的 ?
            const query = queryPart.substring(1);
            // 分割参数对
            const pairs = query.split('&');
            
            for (const pair of pairs) {
                // 处理空参数
                if (!pair) continue;
                
                const idx = pair.indexOf('=');
                // 如果没有 = 号，则值为空字符串
                if (idx === -1) {
                    params.set(decodeURIComponent(pair), '');
                } else {
                    const key = decodeURIComponent(pair.substring(0, idx));
                    const value = decodeURIComponent(pair.substring(idx + 1));
                    params.set(key, value);
                }
            }
        }
        
        // 获取必要参数
        const secret = params.get('secret');
        if (!secret) {
            throw new Error('缺少必要的 secret 参数');
        }
        
        // 如果查询参数中有 issuer，优先使用它
        if (params.has('issuer')) {
            issuer = params.get('issuer');
        }
        
        // 获取其他 OTP 参数，使用默认值
        const digits = parseInt(params.get('digits') || '6', 10);
        const period = parseInt(params.get('period') || '30', 10);
        const algorithm = (params.get('algorithm') || 'SHA1').toUpperCase();
        const counter = type === 'hotp' ? parseInt(params.get('counter') || '0', 10) : 0;
        const remark = params.get('remark') || '';
        
        // 忽略非标准参数，如 codeDisplay
        
        return {
            type,
            name,
            issuer,
            secret,
            digits,
            period,
            algorithm,
            counter,
            remark
        };
    } catch (error) {
        console.error('解析 OTP URI 失败:', error);
        throw new Error('无效的 OTP URI: ' + error.message);
    }
}

// 导入OTP URI
function importOtpUri(uri) {
    try {
        const parsed = parseOtpUri(uri);
        const item = {
            id: crypto.randomUUID().toString(),
            ...parsed
        };
        
        const otpItems = getOtpItems();
        otpItems.push(item);
        db.setItem(DB_KEY_OTP_ITEMS, otpItems);
        
        // 触发自动备份
        setTimeout(() => triggerAutoBackupIfEnabled(), 100);
        
        return item;
    } catch (error) {
        console.error('导入OTP URI失败:', error);
        throw error;
    }
}

// 导入文本文件，每行一个OTP URI
function importOtpTextFile(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('文本内容无效');
    }
    
    // 移除UTF-8 BOM（如果存在）
    let cleanText = text;
    // 检查字符串形式的BOM (\uFEFF) 或 Buffer形式的BOM
    if (text.charCodeAt(0) === 0xFEFF) {
        cleanText = text.slice(1);
    } else if (text.startsWith('\uFEFF')) {
        cleanText = text.slice(1);
    }
    
    // 按行分割文本，过滤空行和注释行
    const lines = cleanText.split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
    
    if (lines.length === 0) {
        throw new Error('文件中没有有效的OTP URI');
    }
    
    const results = {
        success: 0,
        failed: 0,
        errors: []
    };
    
    // 获取现有OTP项目
    const otpItems = getOtpItems();
    
    // 处理每一行
    for (const line of lines) {
        try {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            
            // 尝试解析并导入
            const parsed = parseOtpUri(trimmedLine);
            const item = {
                id: crypto.randomUUID().toString(),
                ...parsed
            };
            
            // 添加到列表
            otpItems.push(item);
            results.success++;
        } catch (error) {
            results.failed++;
            results.errors.push(`行 "${line.substring(0, 20)}${line.length > 20 ? '...' : ''}" 导入失败: ${error.message}`);
        }
    }
    
    // 只有成功导入至少一个才保存
    if (results.success > 0) {
        db.setItem(DB_KEY_OTP_ITEMS, otpItems);
        
        // 触发自动备份
        setTimeout(() => triggerAutoBackupIfEnabled(), 100);
    }
    
    return results;
}

// 从文件导入OTP
function importOtpFromFile(filePath) {
    try {
        if (!filePath || !fs.existsSync(filePath)) {
            throw new Error('文件不存在');
        }
        
        // 读取文件内容
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        
        // 使用importOtpTextFile函数处理文件内容
        return importOtpTextFile(fileContent);
    } catch (error) {
        console.error('从文件导入OTP失败:', error);
        throw error;
    }
}

// 生成OTP URI
function generateOtpUri(item) {
    try {
        if (!item.secret) {
            throw new Error('缺少必要的 secret 参数');
        }
        
        // 构建基础URI
        const type = item.type || 'totp';
        let label = '';
        
        // 构建标签 (issuer:account 或者 name)
        if (item.issuer && item.account) {
            label = `${item.issuer}:${item.account}`;
        } else if (item.issuer && item.name) {
            label = `${item.issuer}:${item.name}`;
        } else if (item.name) {
            label = item.name;
        } else {
            label = 'Account';
        }
        
        // URL编码标签
        const encodedLabel = encodeURIComponent(label);
        
        // 构建查询参数
        const params = new URLSearchParams();
        params.set('secret', item.secret);
        
        if (item.issuer) {
            params.set('issuer', item.issuer);
        }
        
        if (item.digits && item.digits !== 6) {
            params.set('digits', item.digits.toString());
        }
        
        if (item.period && item.period !== 30) {
            params.set('period', item.period.toString());
        }
        
        if (item.algorithm && item.algorithm !== 'SHA1') {
            params.set('algorithm', item.algorithm);
        }
        
        if (type === 'hotp' && item.counter !== undefined) {
            params.set('counter', item.counter.toString());
        }
        
        if (item.remark) {
            params.set('remark', item.remark);
        }
        
        // 构建完整URI
        const uri = `otpauth://${type}/${encodedLabel}?${params.toString()}`;
        
        return uri;
    } catch (error) {
        console.error('生成OTP URI失败:', error);
        throw new Error('生成OTP URI失败: ' + error.message);
    }
}

// 导出OTP到文件
function exportOtpToFile() {
    try {
        // 获取所有OTP项目
        const otpItems = getOtpItems();
        
        if (otpItems.length === 0) {
            throw new Error('没有可导出的验证器');
        }
        
        // 生成导出内容，每行一个OTP URI，并对中文字符进行解码
        const exportContent = otpItems.map(item => {
            const uri = generateOtpUri(item);
            // 解码URI中的中文字符，使其在文本文件中可读
            return decodeURIComponent(uri);
        }).join('\n');
        
        // 添加文件头说明
        const fileHeader = [
            '# FastOtp 验证器导出文件',
            '# 此文件包含您的两步验证配置信息',
            '# 每行一个 otpauth:// URI，可被其他OTP应用程序导入',
            `# 导出时间: ${new Date().toLocaleString('zh-CN')}`,
            `# 共导出 ${otpItems.length} 个验证器`,
            '',
            ''
        ].join('\n');
        
        const fullContent = fileHeader + exportContent;
        
        // 使用uTools API显示保存对话框
        const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const savePath = utools.showSaveDialog({
            title: '导出OTP验证器',
            defaultPath: `FastOtp_导出_${currentDate}.txt`,
            filters: [
                { name: '文本文件', extensions: ['txt'] }
            ]
        });
        
        if (!savePath) {
            // 用户取消了保存
            return { success: false, message: '用户取消了导出' };
        }
        
        // 写入文件 - 尝试多种编码方式确保中文正确显示
        try {
            // 方法1: 使用UTF-8 BOM + Buffer
            const utf8BOM = Buffer.from([0xEF, 0xBB, 0xBF]); // UTF-8 BOM
            const contentBuffer = Buffer.from(fullContent, 'utf8');
            const finalBuffer = Buffer.concat([utf8BOM, contentBuffer]);
            fs.writeFileSync(savePath, finalBuffer);
        } catch (error) {
            try {
                // 方法2: 直接使用utf8编码
                fs.writeFileSync(savePath, fullContent, { encoding: 'utf8' });
            } catch (error2) {
                // 方法3: 使用默认编码
                fs.writeFileSync(savePath, fullContent);
            }
        }
        
        return {
            success: true,
            message: `成功导出 ${otpItems.length} 个验证器到文件`,
            path: savePath,
            count: otpItems.length
        };
        
    } catch (error) {
        console.error('导出OTP失败:', error);
        return {
            success: false,
            message: '导出失败: ' + error.message
        };
    }
}

// ================ 自动备份配置 ================

function getAutoBackupConfig() {
    const config = db.getItem(DB_KEY_AUTO_BACKUP_CONFIG) || {};
    return {
        enabled: config.enabled === true,
        lastBackupAt: config.lastBackupAt || null
    };
}

function setAutoBackupEnabled(enabled) {
    try {
        const current = db.getItem(DB_KEY_AUTO_BACKUP_CONFIG) || {};
        const updated = {
            ...current,
            enabled: Boolean(enabled)
        };
        db.setItem(DB_KEY_AUTO_BACKUP_CONFIG, updated);
        return { success: true, enabled: updated.enabled };
    } catch (error) {
        return { success: false, message: '设置自动备份失败: ' + error.message };
    }
}

// 自动备份触发函数
async function triggerAutoBackupIfEnabled() {
    try {
        const autoConfig = getAutoBackupConfig();
        if (!autoConfig.enabled) {
            return; // 自动备份未启用
        }

        const webdavConfig = getWebDavConfig();
        if (!webdavConfig.url || !webdavConfig.username || !webdavConfig.hasPassword) {
            return; // WebDAV 配置不完整
        }

        // 静默执行备份，不显示用户通知
        const result = await webdavBackup();
        if (result.success) {
            // 更新最后备份时间
            const current = db.getItem(DB_KEY_AUTO_BACKUP_CONFIG) || {};
            current.lastBackupAt = new Date().toISOString();
            db.setItem(DB_KEY_AUTO_BACKUP_CONFIG, current);
        }
    } catch (error) {
        // 静默处理错误，避免打断用户操作
        console.error('自动备份失败:', error);
    }
}

// ================ WebDAV 备份/恢复 ================

function getWebDavConfig() {
    const stored = db.getItem(DB_KEY_WEBDAV_CONFIG) || {};
    return {
        url: stored.url || '',
        username: stored.username || '',
        remotePath: stored.remotePath || '/FastOtp/backup.txt',
        hasPassword: !!stored.password
    };
}

function saveWebDavConfig(config) {
    try {
        if (!config || typeof config !== 'object') {
            throw new Error('配置无效');
        }
        const current = db.getItem(DB_KEY_WEBDAV_CONFIG) || {};
        const next = {
            url: typeof config.url === 'string' ? config.url.trim() : current.url || '',
            username: typeof config.username === 'string' ? config.username.trim() : current.username || '',
            remotePath: typeof config.remotePath === 'string' ? config.remotePath.trim() : (current.remotePath || '/FastOtp/backup.txt'),
            password: current.password
        };
        if (typeof config.password === 'string' && config.password.length > 0) {
            next.password = config.password;
        }
        if (!next.url) throw new Error('请填写 WebDAV 地址');
        if (!next.username) throw new Error('请填写用户名');
        if (!next.password) throw new Error('请填写密码');
        if (!next.remotePath) next.remotePath = '/FastOtp/backup.txt';
        db.setItem(DB_KEY_WEBDAV_CONFIG, next);
        return { success: true, message: '已保存 WebDAV 配置' };
    } catch (error) {
        return { success: false, message: '保存失败: ' + error.message };
    }
}

async function createWebDavClientOrThrow() {
    const cfg = db.getItem(DB_KEY_WEBDAV_CONFIG) || {};
    if (!cfg.url || !cfg.username || !cfg.password) {
        throw new Error('请先在设置中填写完整的 WebDAV 配置');
    }
    try {
        const { createClient } = await importWebDav();
        if (typeof createClient !== 'function') {
            throw new Error('未找到 createClient');
        }
        const client = createClient(cfg.url, {
            username: cfg.username,
            password: cfg.password,
        });
        return { client, cfg };
    } catch (e) {
        throw new Error('创建 WebDAV 客户端失败: ' + (e && e.message ? e.message : String(e)));
    }
}

async function testWebDavConnection() {
    try {
        const { client } = await createWebDavClientOrThrow();
        // 尝试访问根目录，验证凭据
        await client.getDirectoryContents('/');
        return { success: true, message: '连接成功' };
    } catch (error) {
        return { success: false, message: '连接失败: ' + (error.message || String(error)) };
    }
}

function buildOtpExportText() {
    const otpItems = getOtpItems();
    if (otpItems.length === 0) {
        throw new Error('没有可备份的验证器');
    }
    const exportContent = otpItems.map(item => {
        const uri = generateOtpUri(item);
        return decodeURIComponent(uri);
    }).join('\n');
    const header = [
        '# FastOtp 验证器导出文件',
        '# 每行一个 otpauth:// URI，可被其他OTP应用程序导入',
        `# 导出时间: ${new Date().toLocaleString('zh-CN')}`,
        `# 共导出 ${otpItems.length} 个验证器`,
        '',
        '',
    ].join('\n');
    return header + exportContent;
}

async function ensureRemoteDir(client, remotePath) {
    // 仅在备份时确保目录存在
    try {
        const lastSlash = remotePath.lastIndexOf('/');
        const dir = lastSlash > 0 ? remotePath.slice(0, lastSlash) : '/';
        if (!dir || dir === '/') return; // 根目录默认存在
        // 递归创建目录（如果 webdav 服务端支持）
        if (typeof client.createDirectory === 'function') {
            try {
                await client.createDirectory(dir, { recursive: true });
            } catch (_) {
                // 某些服务端不支持 recursive，忽略错误
            }
        }
    } catch (_) {
        // 忽略目录处理错误，由后续写入报错
    }
}

async function webdavBackup() {
    try {
        const { client, cfg } = await createWebDavClientOrThrow();
        const content = buildOtpExportText();
        const remotePath = cfg.remotePath || '/FastOtp/backup.txt';
        await ensureRemoteDir(client, remotePath);
        const utf8BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
        const contentBuffer = Buffer.from(content, 'utf8');
        const finalBuffer = Buffer.concat([utf8BOM, contentBuffer]);
        await client.putFileContents(remotePath, finalBuffer, { overwrite: true });
        db.setItem('last_webdav_backup_at', new Date().toISOString());
        return { success: true, message: '备份成功', path: remotePath, bytes: finalBuffer.length };
    } catch (error) {
        return { success: false, message: '备份失败: ' + (error.message || String(error)) };
    }
}

async function webdavRestore() {
    try {
        const { client, cfg } = await createWebDavClientOrThrow();
        const remotePath = cfg.remotePath || '/FastOtp/backup.txt';
        const buf = await client.getFileContents(remotePath);
        let text = '';
        if (Buffer.isBuffer(buf)) {
            // 去除可能的 BOM
            if (buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
                text = buf.slice(3).toString('utf8');
            } else {
                text = buf.toString('utf8');
            }
        } else if (typeof buf === 'string') {
            text = buf;
        } else {
            text = String(buf || '');
        }

        const result = importOtpTextFile(text);
        if (result.success > 0) {
            return { success: true, imported: result.success, failed: result.failed, errors: result.errors };
        }
        return { success: false, imported: 0, failed: result.failed, errors: result.errors };
    } catch (error) {
        return { success: false, imported: 0, failed: 0, errors: ['恢复失败: ' + (error.message || String(error))] };
    }
}









