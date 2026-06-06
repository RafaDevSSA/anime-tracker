import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { ScheduleService } from './ScheduleService';
import { NotificationService } from './NotificationService';
import { SettingsRepository } from '../db/SettingsRepository';

export const BACKGROUND_TASK_NAME = 'anime-episode-check';

TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
  try {
    const { checkHour } = await SettingsRepository.get();
    if (new Date().getHours() !== checkHour) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }
    const episodes = await ScheduleService.refreshTodayEpisodes();
    if (episodes.length > 0) {
      await NotificationService.scheduleToday(episodes);
    }
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export const BackgroundTaskService = {
  async register(): Promise<void> {
    try {
      const status = await BackgroundTask.getStatusAsync();
      if (status !== BackgroundTask.BackgroundTaskStatus.Available) return;
      await BackgroundTask.registerTaskAsync(BACKGROUND_TASK_NAME, {
        minimumInterval: 60 * 60,
      });
    } catch {
      // Background tasks not supported in this environment (e.g. Expo Go)
    }
  },

  async unregister(): Promise<void> {
    try {
      await BackgroundTask.unregisterTaskAsync(BACKGROUND_TASK_NAME);
    } catch {}
  },

  async isRegistered(): Promise<boolean> {
    return TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
  },
};
