// zTools exposes the uTools-compatible API as `ztools`.
// Normalize it before any application module is evaluated.
const pluginWindow = window as typeof window & { ztools?: typeof window.utools }

if (!pluginWindow.utools && pluginWindow.ztools) {
  pluginWindow.utools = pluginWindow.ztools
}
