import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import App from './App';

if (Platform.OS === 'web') {
  // Global web reset (full-height, no horizontal overflow).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('./global.css');

  // Expo's web export does not honor app.json's web.dir — the exported
  // <html> only gets lang="he", never dir="rtl". Without a real dir="rtl" on
  // the document, the browser's native CSS flexbox RTL mirroring never
  // activates, so `flexDirection: 'row'` containers (header, stepper, nav)
  // render in physical left-to-right order despite the Hebrew text. Setting
  // it here, before the app mounts, is the actual fix — do it early to avoid
  // a layout flash.
  if (typeof document !== 'undefined') {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'he';
  }
}

registerRootComponent(App);
