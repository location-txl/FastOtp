# FastOtp - uTools OTP 插件

这是一个为 [uTools](https://www.u-tools.cn/) 开发的插件，用于快速查看和管理二次验证（OTP）代码。

## 主要功能

*   快速显示配置的 OTP 代码

## 技术栈

*   构建工具: [Vite](https://vitejs.dev/)
*   前端框架: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
*   UI 库: [Ant Design](https://ant.design/)

## 开发

本项目基于标准的 uTools 插件结构：

*   `plugin.json`: 插件的配置文件。
*   `preload.js`: 用于在 uTools 环境下连接 UI 层和 Node.js API。
*   `src/`: 包含 React 应用的源代码。

### 启动开发环境

```bash
npm install && cd plugin && npm install && cd ..
npm run dev
```

### 构建插件

```bash
npm run build
```

