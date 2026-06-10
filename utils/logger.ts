type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

function format(level: LogLevel, tag: string, message: string): string {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 23);
  return `[${ts}] ${level.padEnd(5)} [${tag}] ${message}`;
}

function shouldLog(level: LogLevel): boolean {
  if (__DEV__) return true;
  return level === 'WARN' || level === 'ERROR';
}

export const log = {
  debug(tag: string, message: string, data?: unknown) {
    if (!shouldLog('DEBUG')) return;
    console.log(format('DEBUG', tag, message), data ?? '');
  },
  info(tag: string, message: string, data?: unknown) {
    if (!shouldLog('INFO')) return;
    console.log(format('INFO', tag, message), data ?? '');
  },
  warn(tag: string, message: string, data?: unknown) {
    if (!shouldLog('WARN')) return;
    console.warn(format('WARN', tag, message), data ?? '');
  },
  error(tag: string, message: string, error?: unknown) {
    if (!shouldLog('ERROR')) return;
    console.error(format('ERROR', tag, message), error ?? '');
  },
};
