import { createContext } from "react";

interface MatchFile {
    isFile: boolean;
    isDirectory: boolean;
    name: string;
    path: string;
}

interface MatchWindow {
    id: number;
    class: string;
    title: string;
    x: number;
    y: number;
    width: number;
    height: number;
    appPath: string;
    pid: number;
    app: string;
}

export interface PluginEnterAction {
    code: string;
    type: "text" | "img" | "file" | "regex" | "over" | "window";
    payload: string | MatchFile[] | MatchWindow;
    from: "main" | "panel" | "hotkey" | "reirect";
    option?: {
        mainPush: boolean;
    };
}

export const PluginEnterContext = createContext<PluginEnterAction | undefined>(undefined);

