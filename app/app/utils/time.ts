export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function calculateStreak(currentStreak: number, lastDate: string | null, currentDate: string): number {
    if (!lastDate) {
        return 1;
    }
    
    const last = new Date(lastDate);
    const current = new Date(currentDate);
    
    last.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
        return currentStreak;
    } else if (daysDiff === 1) {
        return currentStreak + 1;
    } else {
        return 1;
    }
}
