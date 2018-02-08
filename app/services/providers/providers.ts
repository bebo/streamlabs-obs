import { FProvider } from './provider';
import { StatefulService, mutation } from '../stateful-service';
import { ipcRenderer } from 'electron';
import { getConfigFilePath } from '../config';
import * as obs from '../obs-api';
import Vue from 'vue';

const Config = require('electron-store');

interface IProviderServiceState {
  providers: Dictionary<FProvider>;
}

export class ProviderService extends StatefulService<IProviderServiceState> {
  config = new Config({ name: 'Providers' });

  static initialState: IProviderServiceState = {
    providers: {}
  };

  static getUniqueId(): string {
    return 'provider_' + ipcRenderer.sendSync('getUniqueId');
  }

  protected init() {
    super.init();

    const providers: any = this.config.store;

    this.LOAD_PROVIDERS(providers);

    for (const key in providers) {
      const name = key;
      const type = providers[key].type;
      const settings = providers[key].settings;

      providers[key].uniqueId = key;
      FProvider.init(type, name, settings);
    }
  }

  @mutation()
  private LOAD_PROVIDERS(store: any) {
    Object.assign(this.state, store);
  }

  @mutation()
  private ADD_PROVIDER(fProvider: FProvider) {
    Vue.set(this.state, fProvider.uniqueId, fProvider);
  }

  @mutation()
  private REMOVE_PROVIDER(uniqueId: string) {
    Vue.delete(this.state, uniqueId);
  }

  addProvider(provider: FProvider) {
    this.ADD_PROVIDER(provider);

    const sObject = {
      type: provider.type,
      settings: provider.settings
    };

    this.config.set(provider.uniqueId, sObject);
  }

  removeProvider(uniqueId: string) {
    const service = obs.ServiceFactory.fromName(uniqueId);
    service.release();

    this.REMOVE_PROVIDER(uniqueId);
    this.config.delete(uniqueId);
  }

  isProvider(uniqueId: string) {
    const obsService: obs.IService = obs.ServiceFactory.fromName(uniqueId);

    if (obsService) return true;

    return false;
  }
}
