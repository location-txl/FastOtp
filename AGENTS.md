# Repository Guidelines

## 项目结构与模块组织
- React + TypeScript 应用，构建工具为 Vite（入口 `src/App.tsx`，核心逻辑 `src/OtpManager.tsx`）。
- UI 组件与功能就近存放于 `src/components/` 与 `src/hooks/`，静态资源位于 `public/`。
- uTools 相关逻辑集中在 `plugin/`：`plugin.json` 定义指令，`preload.js` 负责桥接，`otp_code.js` 生成 OTP，生产构建输出到 `plugin/dist/`。
- 配置文件：`vite.config.ts` 控制输出路径，`eslint.config.js` 管理规则，TypeScript 配置在 `tsconfig*.json`。

## 构建、测试与开发命令
- 初始化依赖：```bash
npm install && cd plugin && npm install && cd ..
```
- 本地开发（默认 5173 端口）：```bash
npm run dev
```
- 生产构建（输出到 `plugin/dist/`）：```bash
npm run build
```
- 代码质量检查：```bash
npm run lint
```
- 类型检查：```bash
tsc -b
```

## 代码风格与命名约定
- TypeScript 优先，保持类型完整；缩进使用 2 空格，避免无必要的包装层或抽象。
- 组件与样式命名偏功能化（如 `otp-card`、`search-bar`），避免冗长容器式命名。
- 遵循 ESLint 配置输出的规则；提交前确保无 lint 警告与类型错误。

## 测试与验证指引
- 当前未内置单元测试框架；提交前至少运行 `npm run lint` 与 `tsc -b`。
- 新增核心算法（如 OTP 生成、存储逻辑）时，补充手动验证步骤或自定义脚本，并在描述中记录验证方式。

## 提交与合并请求
- 提交信息保持简洁，以动词开头（示例：`feat: add otp search filter`，`fix: handle preload init error`）。
- PR 描述需包含变更要点、影响范围与本地验证结果；涉及 UI 变更附上截图或说明交互。
- 控制单次改动粒度，围绕单一功能/修复，方便回顾与回滚。

## 安全与配置提示
- 不要提交任何 OTP 秘钥或个人数据；敏感信息应存储在 uTools 加密存储，由 `preload.js` 读取。
- 构建产物 `plugin/dist/` 可重建，请勿手动修改；插件窗口高度在 uTools 固定为 800px，请在 UI 设计时留意可视区域。***
