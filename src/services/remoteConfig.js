import remoteConfig from '@react-native-firebase/remote-config';
import { Platform } from 'react-native';
import { version as appVersion } from '../../package.json';

// Get the Remote Config instance
const getRemoteConfig = () => remoteConfig();

function parseSemver(versionString) {
  const parts = String(versionString).split('.').map((v) => parseInt(v || '0', 10));
  const [major = 0, minor = 0, patch = 0] = parts;
  return { major, minor, patch };
}

export function isVersionLower(current, minimum) {
  const c = parseSemver(current);
  const m = parseSemver(minimum);
  if (c.major !== m.major) return c.major < m.major;
  if (c.minor !== m.minor) return c.minor < m.minor;
  return c.patch < m.patch;
}

export async function fetchForceUpdateConfig() {
  try {
    const rc = getRemoteConfig();
    
    // Set defaults so app behaves safely if fetch fails
    await rc.setDefaults({
      app_force_update: JSON.stringify({
        force_update_enabled: false,
        min_app_version: '0.0.0',
        store_url_android: '',
        store_url_ios: '',
        update_message: 'A new version is available.',
        update_title: 'Update Available'
      })
    });

    // Reasonable fetch intervals
    await rc.setConfigSettings({
      minimumFetchIntervalMillis: !__DEV__ ? 0 : 60 * 60 * 1000
    });

    // Fetch and activate
    await rc.fetchAndActivate();

    const jsonString = rc.getValue('app_force_update').asString();
    console.log('📥 Remote Config Raw JSON String:', jsonString);
    
    let data;
    try {
      data = JSON.parse(jsonString || '{}');
      console.log('📥 Remote Config Parsed Data:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.warn('Failed to parse Remote Config JSON:', e);
      data = {};
    }

    const currentVersion = appVersion || '0.0.0';
    const platform = Platform.OS;

    const {
      force_update_enabled = false,
      min_app_version = '0.0.0',
      store_url_android = '',
      store_url_ios = '',
      update_message = 'A new version of the app is available. Please update to continue.',
      update_title = 'Update Required'
    } = data;

    const needsUpdate = Boolean(force_update_enabled) && isVersionLower(currentVersion, String(min_app_version));

    console.log('🔍 Force Update Check:');
    console.log('  - Current Version:', currentVersion);
    console.log('  - Min Version:', min_app_version);
    console.log('  - Force Update Enabled:', force_update_enabled);
    console.log('  - Needs Update:', needsUpdate);
    console.log('  - Platform:', platform);

    const result = {
      needsUpdate,
      updateTitle: String(update_title || ''),
      updateMessage: String(update_message || ''),
      storeUrl: platform === 'ios' ? String(store_url_ios || '') : String(store_url_android || ''),
      currentVersion: currentVersion,
      minVersion: String(min_app_version || '')
    };

    console.log('📤 Remote Config Result:', JSON.stringify(result, null, 2));
    
    return result;
  } catch (error) {
    console.warn('Remote Config fetch failed:', error);
    // Return safe defaults that don't block the app
    return {
      needsUpdate: false,
      updateTitle: '',
      updateMessage: '',
      storeUrl: '',
      currentVersion: appVersion || '0.0.0',
      minVersion: '0.0.0'
    };
  }
}


