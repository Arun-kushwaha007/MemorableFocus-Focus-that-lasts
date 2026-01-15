import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadStreak(): Promise<{ streak: number; lastCompletionDate: string | null }> {
    try {
      const streakValue = await AsyncStorage.getItem('@focus_timer_streak');
      const lastDateValue = await AsyncStorage.getItem('@focus_timer_last_completion');
      
      const streak = streakValue ? parseInt(streakValue, 10) : 0;
      const lastCompletionDate = lastDateValue || null;
      
      if (isNaN(streak)) {
        return { streak: 0, lastCompletionDate: null };
      }
      
      return { streak, lastCompletionDate };
    } catch (error) {
      console.error('Error loading streak:', error);
      return { streak: 0, lastCompletionDate: null };
    }
}
  
export async function saveStreak(newStreak: number, date: string): Promise<void> {
    try {
        await AsyncStorage.setItem('@focus_timer_streak', String(newStreak));
        await AsyncStorage.setItem('@focus_timer_last_completion', date);
    } catch (error) {
        console.error('Error saving streak:', error);
    }
}

export async function loadCustomTime(): Promise<number | null> {
    try {
        const savedTime = await AsyncStorage.getItem('@focus_timer_custom_time');
        if (savedTime) {
            const time = parseInt(savedTime, 10);
            return isNaN(time) ? null : time;
        }
        return null;
    } catch (e) {
        console.error("Error loading custom time:", e);
        return null;
    }
}

export async function saveCustomTime(seconds: number): Promise<void> {
    try {
        await AsyncStorage.setItem('@focus_timer_custom_time', String(seconds));
    } catch (e) {
        console.error("Error saving custom time", e);
    }
}
