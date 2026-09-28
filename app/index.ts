import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import App from './App';

// Global web reset (full-height, no horizontal overflow). No-op on native.
if (Platform.OS === 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('./global.css');
}

registerRootComponent(App);
