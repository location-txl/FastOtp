# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FastOtp is a uTools plugin for managing and displaying Two-Factor Authentication (2FA) OTP codes. It's built as a React application that integrates with the uTools desktop app ecosystem.

## Development Commands

### Setup
```bash
# Install dependencies for both main app and plugin
npm install && cd plugin && npm install && cd ..
```

### Development
```bash
# Start development server (runs on localhost:5173)
npm run dev
```

### Build
```bash
# Build the plugin for production
npm run build
```

### Code Quality
```bash
# Run linting
npm run lint

# TypeScript type checking
tsc -b
```

## Architecture

### uTools Plugin Structure
This project follows uTools plugin architecture with two main parts:

1. **React UI Layer** (`src/`) - Main application interface
2. **uTools Integration Layer** (`plugin/`) - Platform-specific integration

### Key Files
- `plugin/plugin.json` - uTools plugin configuration and feature definitions
- `plugin/preload.js` - Bridge between React UI and Node.js APIs (similar to Electron preload)
- `src/custom.d.ts` - TypeScript definitions for uTools API and plugin interfaces
- `vite.config.ts` - Build configuration that outputs to `plugin/dist/`

### Component Architecture
- `App.tsx` - Root component with theme and context providers
- `OtpManager.tsx` - Main application logic and state management
- `components/` - Modular UI components (OtpCard, OtpForm, etc.)
- `hooks/` - Custom React hooks including uTools integration

### State Management
- Uses React local state with hooks
- Data persistence through uTools storage APIs
- Real-time OTP code generation with shared timer logic

### uTools Integration Points
- **Plugin Entry**: Configured via `plugin.json` with commands like "OTP", "二次验证"
- **Storage**: Uses uTools crypto storage for sensitive OTP secrets
- **UI Integration**: Sub-input for search, notifications, clipboard access
- **Theme**: Automatically adapts to uTools dark/light mode

### Data Flow
1. OTP items stored in uTools encrypted storage
2. `preload.js` provides secure API bridge to Node.js OTP generation
3. React components consume OTP data via `window.api` interface
4. Real-time code updates using shared timer and refresh counter

## Technology Stack
- **Build Tool**: Vite with React SWC plugin
- **Frontend**: React 19 + TypeScript + Ant Design
- **Platform**: uTools plugin system
- **OTP Library**: Custom implementation in `plugin/otp_code.js`

## Plugin Development Notes
- Development mode serves UI from `localhost:5173` (configured in plugin.json)
- Production builds output to `plugin/dist/` directory
- Plugin height is fixed at 800px in uTools
- Single instance plugin (only one window can be open)