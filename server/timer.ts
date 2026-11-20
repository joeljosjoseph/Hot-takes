const timers = new Map<string, NodeJS.Timeout>();   // gets sent to clients

export function startTimer(key: string, ms: number, onDone: () => void) {
    stopTimer(key);                       //  delete previous timer if exists?
    timers.set(key, setTimeout(onDone, ms));
}

export function stopTimer(key: string) {
    const t = timers.get(key);
    if (t) clearTimeout(t);
    timers.delete(key);
}