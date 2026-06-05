import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { ScheduleService } from './ScheduleService';
import { NotificationService } from './NotificationService';

export const BACKGROUND_FETCH_TASK = 'anime-episode-check';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const episodes = await ScheduleService.refreshTodayEpisodes();
    if (episodes.length > 0) {
      await NotificationService.scheduleToday(episodes);
    }
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export const BackgroundTaskService = {
  async register(): Promise<void> {
    const status = await BackgroundFetch.getStatusAsync();
    if (
      status === BackgroundFetch.BackgroundFetchStatus.Restricted ||
      status === BackgroundFetch.BackgroundFetchStatus.Denied
    ) {
      return;
    }

    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 8 * 60 * 60, // 8h em segundos
      stopOnTerminate: false,
      startOnBoot: true,
    });
  },

  async unregister(): Promise<void> {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
  },

  async isRegistered(): Promise<boolean> {
    return TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
  },
};
