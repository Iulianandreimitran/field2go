// utils/socketServerInstance.js

export function getSocketServerInstance() {
  if (typeof global !== "undefined" && global._socketServerInstance) {
    return global._socketServerInstance;
  }
  console.warn("⚠️ Socket.IO server instance nu este inițializat!");
  return null;
}
