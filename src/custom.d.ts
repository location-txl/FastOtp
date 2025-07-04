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
}

interface ImportTextFileResult {
    success: number;
    failed: number;
    errors: string[];
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
            [key: string]: any;
        }
    }
}