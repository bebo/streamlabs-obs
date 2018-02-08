import fs from 'fs';
import path from 'path';
import electron from 'electron';

/* Why not use PersistenStatefulService?
 * Occasionally, there is data we want to store
 * in the vuex store but we don't want to 
 * persistently cache. As a result, this was made
 * so we can have explicit control over what's cached.
 * For instance, I'd like to store the reconnecting
 * state but I don't want to store the reconnecting
 * state for an output that doesn't even exist anymore
 * persistently.  */

export function getConfigFilePath(name: string) {
  const configFolderPath = path.join(
    electron.remote.app.getPath('userData'),
    'Config'
  );

  if (!fs.existsSync(configFolderPath)) {
    fs.mkdirSync(configFolderPath);
  }

  return path.join(configFolderPath, `${name}.json`);
}
