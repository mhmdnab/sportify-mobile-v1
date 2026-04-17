import { create } from 'zustand';
import { I18nManager, Alert } from 'react-native';
import { storageGet, storageSet } from '../lib/secure-store';
import i18n from '../i18n';

const LOCALE_KEY = 'sportify_locale';

interface LanguageState {
  locale: string;
  isRTL: boolean;
  setLocale: (locale: string) => Promise<void>;
  loadLocale: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  locale: i18n.language || 'en',
  isRTL: i18n.language === 'ar',

  setLocale: async (locale: string) => {
    const isRTL = locale === 'ar';
    await i18n.changeLanguage(locale);
    await storageSet(LOCALE_KEY, locale);

    set({ locale, isRTL });

    // If RTL state changed, we need to restart the app
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.allowRTL(isRTL);
      I18nManager.forceRTL(isRTL);
      Alert.alert(
        locale === 'ar' ? 'إعادة تشغيل مطلوبة' : 'Restart Required',
        locale === 'ar'
          ? 'يرجى إعادة تشغيل التطبيق لتطبيق تغيير اللغة.'
          : 'Please restart the app to apply the language change.',
      );
    }
  },

  loadLocale: async () => {
    const savedLocale = await storageGet(LOCALE_KEY);
    if (savedLocale && savedLocale !== i18n.language) {
      const isRTL = savedLocale === 'ar';
      await i18n.changeLanguage(savedLocale);

      if (I18nManager.isRTL !== isRTL) {
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
      }

      set({ locale: savedLocale, isRTL });
    }
  },
}));
