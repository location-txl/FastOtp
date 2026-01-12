/* eslint-disable @typescript-eslint/no-explicit-any */



export interface OtpItem {
    id: string;
    name: string;
    secret: string;
    issuer?: string;
    account?: string;
    remark?: string;
    digits?: number;
    period?: number;
    algorithm?: 'SHA1' | 'SHA256' | 'SHA512';
    type?: 'totp' | 'hotp';
    counter?: number;
    deletedAt?: string; // ISO string timestamp for when item was deleted
}

export interface WebdavBackupConfig {
    dirUrl: string;
    username?: string;
    password?: string;
    encryptPassword?: string;
    retentionDays?: number; // 0 表示不自动清理
    autoBackup?: boolean; // 默认开启：OTP 变更后自动备份
    allowInsecure?: boolean; // 允许忽略 HTTPS 证书校验（不推荐）
}

export interface WebdavBackupItem {
    filename: string;
    createdAt: number; // 毫秒时间戳
    size?: number;
    schemaVersion?: number;
}

interface WebdavBackupTestResult {
    success: boolean;
    message: string;
}

interface WebdavBackupResult {
    success: boolean;
    message: string;
    filename?: string;
    createdAt?: number; // 毫秒时间戳
    size?: number;
    count?: number;
}

interface AutoBackupStatus {
    running: boolean;
    scheduled: boolean;
}

interface ImportTextFileResult {
    success: number;
    failed: number;
    errors: string[];
}

interface ExportResult {
    success: boolean;
    message: string;
    path?: string;
    count?: number;
}

declare global {
    interface Window {
        api: {
            otp: {
                generateTOTP: (secret: string, options?: {
                    digits?: number,
                    period?: number,
                    algorithm?: 'SHA1' | 'SHA256' | 'SHA512'
                }) => string;
                generateNextTOTP: (secret: string, options?: {
                    digits?: number,
                    period?: number,
                    algorithm?: 'SHA1' | 'SHA256' | 'SHA512'
                }) => string;
                getOtpItems: () => OtpItem[];
                saveOtpItem: (item: OtpItem) => OtpItem;
                deleteOtpItem: (id: string) => void;
                updateOtpItem: (item: OtpItem) => void;
                copyToClipboard: (text: string) => void;
                parseOtpUri: (uri: string) => OtpItem;
                importOtpUri: (uri: string) => OtpItem;
                importOtpTextFile: (text: string) => ImportTextFileResult;
                importOtpFromFile: (filePath: string) => ImportTextFileResult;
                exportOtpToFile: () => ExportResult;
                generateOtpUri: (item: OtpItem) => string;
                getDeletedItems: () => OtpItem[];
                restoreDeletedItem: (id: string) => boolean;
                permanentDeleteItem: (id: string) => boolean;
            },
            backup: {
                getWebdavConfig: () => WebdavBackupConfig;
                setWebdavConfig: (config: WebdavBackupConfig) => boolean;
                getAutoBackupStatus: () => AutoBackupStatus;
                onAutoBackupStatusChange: (listener: (status: AutoBackupStatus) => void) => () => void;
                testWebdavConnection: (configOverride?: Partial<WebdavBackupConfig>) => Promise<WebdavBackupTestResult>;
                createWebdavBackup: (configOverride?: Partial<WebdavBackupConfig>) => Promise<WebdavBackupResult>;
                listWebdavBackups: (configOverride?: Partial<WebdavBackupConfig>) => Promise<WebdavBackupItem[]>;
                restoreWebdavBackup: (filename: string, configOverride?: Partial<WebdavBackupConfig>) => Promise<WebdavBackupResult>;
            }
        }
        utools?: {
            isDarkColors: () => boolean;
            showMainWindow: () => boolean;
            hideMainWindow: (isRestorePreWindow?: boolean) => boolean;
            setExpendHeight: (height: number) => boolean;
            setSubInput: (onChange: (details: { text: string }) => void, placeholder?: string, isFocus?: boolean) => boolean;
            removeSubInput: () => boolean;
            setSubInputValue: (text: string) => boolean;
            subInputFocus: () => boolean;
            subInputBlur: () => boolean;
            subInputSelect: () => boolean;
            onPluginEnter: (callback: (data: any) => void) => void;
            outPlugin: (isKill?: boolean) => boolean;
            redirect: (label: string | [string, string], payload?: any) => boolean;
            showSaveDialog: (options?: {
                title?: string;
                defaultPath?: string;
                filters?: { name: string; extensions: string[] }[];
            }) => string | undefined;
            showOpenDialog: (options?: {
                title?: string;
                filters?: { name: string; extensions: string[] }[];
                properties?: string[];
            }) => string[] | undefined;
            showNotification: (body: string, clickFeatureCode?: string) => boolean;
            [key: string]: any;
        }
    }
}
