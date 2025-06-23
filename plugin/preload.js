console.log("preload.js loaded")

const otpCode = require('./otp_code');
const fs = require('fs');

const DB_KEY_OTP_ITEMS = 'otp_items';
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
        exportOtpToFile
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
    return item;
}

// 更新OTP项目
function updateOtpItem(item) {
    const otpItems = getOtpItems();
    const index = otpItems.findIndex(i => i.id === item.id);
    if (index !== -1) {
        otpItems[index] = item;
        db.setItem(DB_KEY_OTP_ITEMS, otpItems);
        return true;
    }
    return false;
}

// 删除OTP项目
function deleteOtpItem(id) {
    const otpItems = getOtpItems();
    const index = otpItems.findIndex(i => i.id === id);
    if (index !== -1) {
        otpItems.splice(index, 1);
        db.setItem(DB_KEY_OTP_ITEMS, otpItems);
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
        
        // 忽略非标准参数，如 codeDisplay
        
        return {
            type,
            name,
            issuer,
            secret,
            digits,
            period,
            algorithm,
            counter
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
    
    // 按行分割文本
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length === 0) {
        throw new Error('文件内容为空');
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

// 将 OtpItem 转换为 otpauth URI
function formatOtpUri(item) {
    const issuerPart = item.issuer ? encodeURIComponent(item.issuer) + ':' : '';
    const label = issuerPart + encodeURIComponent(item.name);
    const params = new URLSearchParams();
    params.set('secret', item.secret);
    if (item.issuer) params.set('issuer', item.issuer);
    if (item.digits) params.set('digits', String(item.digits));
    if (item.period) params.set('period', String(item.period));
    if (item.algorithm) params.set('algorithm', item.algorithm.toUpperCase());
    return `otpauth://totp/${label}?${params.toString()}`;
}

// 导出OTP到文本文件，每行一个otpauth URI
function exportOtpToFile(filePath) {
    try {
        const items = getOtpItems();
        const lines = items.map(formatOtpUri).join('\n');
        fs.writeFileSync(filePath, lines, 'utf-8');
        return true;
    } catch (error) {
        console.error('导出OTP失败:', error);
        return false;
    }
}









