import AsyncStorage from '@react-native-async-storage/async-storage';
import { Workout } from '../types/workout';

const WORKOUTS_KEY = 'gymchat_workouts';
const SETTINGS_KEY = 'gymchat_settings';

export interface AppSettings {
  weightUnit: 'kg' | 'lb';
  userName: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  weightUnit: 'lb',
  userName: '',
};

export async function loadWorkouts(): Promise<Workout[]> {
  try {
    const data = await AsyncStorage.getItem(WORKOUTS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load workouts:', error);
  }
  return [];
}

export async function saveWorkouts(workouts: Workout[]): Promise<void> {
  try {
    await AsyncStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
  } catch (error) {
    console.error('Failed to save workouts:', error);
  }
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}
