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
    version: "1.5.0",
    date: "2026-1-12",
    features: [
      "支持 webdav 备份功能",
    ]
  },
  {
    version: "1.3.0",
    date: "2025-8-10",
    features: [
      "添加已删除验证器回收站功能，支持恢复误删的验证器",
      "添加更新日志弹窗功能，方便查看版本更新内容",
      "支持导出验证器到文件，便于数据备份和迁移"
    ],
    improvements: [
      "优化备注弹窗显示效果，支持正确显示换行内容",
    ],
    bugfixes: [
      "修复备注弹窗鼠标事件穿透问题",
    ]
  },
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