import * as Notifications from 'expo-notifications';
import { SettingsRepository } from '../db/SettingsRepository';
import type { TodayEpisode } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function isInQuietHours(hour: number, quietStart: number, quietEnd: number): boolean {
  if (quietStart <= quietEnd) return hour >= quietStart && hour < quietEnd;
  // wraps midnight, e.g. 22-8
  return hour >= quietStart || hour < quietEnd;
}

export const NotificationService = {
  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async scheduleToday(episodes: TodayEpisode[]): Promise<void> {
    if (episodes.length === 0) return;

    const { quietStart, quietEnd } = await SettingsRepository.get();
    const currentHour = new Date().getHours();
    if (isInQuietHours(currentHour, quietStart, quietEnd)) return;

    const lines = episodes.map((ep) => `${ep.title} ep ${ep.ep_num}`).join('\n');
    const count = episodes.length;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: count === 1 ? '1 anime novo hoje!' : `${count} animes novos hoje!`,
        body: lines,
        data: { mal_ids: episodes.map((e) => e.mal_id) },
      },
      trigger: null,
    });
  },
};
