import * as Notifications from 'expo-notifications';
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

export const NotificationService = {
  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async scheduleToday(episodes: TodayEpisode[]): Promise<void> {
    if (episodes.length === 0) return;

    const lines = episodes.map((ep) => `${ep.title} ep ${ep.ep_num}`).join('\n');
    const count = episodes.length;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: count === 1 ? '1 anime novo hoje!' : `${count} animes novos hoje!`,
        body: lines,
        data: { mal_ids: episodes.map((e) => e.mal_id) },
      },
      trigger: null, // disparo imediato
    });
  },
};
