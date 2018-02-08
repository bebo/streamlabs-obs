import * as obs from '../obs-api';

export class FProvider {
  uniqueId: string;
  type: string;
  key: string = null; /* Stream Key */
  url: string = null; /* Actual URL to provider */
  username: string = null; /* username for login if applicable */
  password: string = null; /* password for login if applicable */
  provider: string = null; /* Name of the provider, e.g. 'Twitch' */

  settings: obs.ISettings = null;

  constructor(type: string, uniqueId: string, settings?: obs.ISettings) {
    FProvider.init(type, uniqueId, settings);

    if (settings) this.settings = settings;
    this.uniqueId = uniqueId;
    this.type = type;
  }

  static init(type: string, uniqueId: string, settings?: obs.ISettings) {
    let obsService: obs.IService = null;

    if (settings) {
      obsService = obs.ServiceFactory.create(type, uniqueId, settings);
    } else obsService = obs.ServiceFactory.create(type, uniqueId);

    if (!obsService) throw 'failed to create service';
  }
}
