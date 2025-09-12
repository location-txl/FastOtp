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

interface WebDavConfigPublic {
    url: string;
    username: string;
    remotePath: string;
    hasPassword: boolean;
}

interface WebDavSaveResult {
    success: boolean;
    message: string;
}

interface WebDavTestResult {
    success: boolean;
    message: string;
}

interface WebDavBackupResult {
    success: boolean;
    message: string;
    path?: string;
    bytes?: number;
}

interface WebDavRestoreResult {
    success: boolean;
    imported: number;
    failed: number;
    errors?: string[];
}

interface AutoBackupConfig {
    enabled: boolean;
    lastBackupAt: string | null;
}

interface AutoBackupSetResult {
    success: boolean;
    enabled?: boolean;
    message?: string;
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
                // WebDAV 备份
                getWebDavConfig: () => WebDavConfigPublic;
                saveWebDavConfig: (cfg: { url?: string; username?: string; password?: string; remotePath?: string }) => WebDavSaveResult;
                testWebDavConnection: () => Promise<WebDavTestResult>;
                webdavBackup: () => Promise<WebDavBackupResult>;
                webdavRestore: () => Promise<WebDavRestoreResult>;
                // 自动备份
                getAutoBackupConfig: () => AutoBackupConfig;
                setAutoBackupEnabled: (enabled: boolean) => AutoBackupSetResult;
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
            hideMainWindowTypeString?: (text: string) => boolean;
            [key: string]: any;
        }
    }
}