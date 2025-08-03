export interface ChangelogEntry {
  version: string;
  date: string;
  features?: string[];
  improvements?: string[];
  bugfixes?: string[];
  breaking?: string[];
}

export const CHANGELOG_DATA: ChangelogEntry[] = [
  {
    version: "1.2.1",
    date: "2025-7-4",
    bugfixes: [
      "修改表单关闭处理逻辑，解决打开新的 From 保留上一个 Rmark 的问题",
     ]
  },
  {
    version: "1.2.0", 
    date: "2025-7-4",
    features: [
      "添加和编辑验证器时支持备注信息 在卡片最下方展示 超过20个字符 可以点击icon 弹窗展示全部",
      "回车复制验证码时支持自动输入验证码到输入框"
    ],
  
  }
];