import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { ScheduleService } from './ScheduleService';
import { NotificationService } from './NotificationService';
import { SettingsRepository } from '../db/SettingsRepository';

export const BACKGROUND_FETCH_TASK = 'anime-episode-check';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const { checkHour } = await SettingsRepository.get();
    if (new Date().getHours() !== checkHour) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
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
      minimumInterval: 60 * 60, // poll a cada hora; checkHour filtra o horário correto
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
