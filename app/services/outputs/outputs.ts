import Vue from 'vue';
import { FOutput } from './output';
import { StatefulService, mutation } from '../stateful-service';
import { ipcRenderer } from 'electron';
import { EncoderService } from '../encoders';
import { ProviderService } from '../providers';
import { Inject } from '../../util/injector';
import * as obs from '../obs-api';

const Config = require('electron-store');

interface IOutputServiceState {
  outputs: Dictionary<FOutput>;
}

export class OutputService extends StatefulService<IOutputServiceState> {
  @Inject() providerService: ProviderService;
  @Inject() encoderService: EncoderService;
  
  config = new Config({ name: 'Outputs' });

  static initialState: IOutputServiceState = {
    outputs: {}
  };

  static getUniqueId(): string {
    return 'output_' + ipcRenderer.sendSync('getUniqueId');
  }

  init() {
    super.init();

    const outputs = this.config.store;

    this.LOAD_OUTPUTS(outputs);

    for (const key in outputs) {
      const output = outputs[key];
      const name = key;
      const type = output.type;
      const settings = output.settings;

      output.uniqueId = key;
      FOutput.init(type, name, settings);

      if (output.audioEncoder && output.videoEncoder) {
        const audioEncoder = output.audioEncoder;
        const videoEncoder = output.videoEncoder;

        if (
          this.encoderService.isAudioEncoder(audioEncoder) &&
          this.encoderService.isVideoEncoder(videoEncoder)
        ) {
          this.setOutputEncoders(key, audioEncoder, videoEncoder);
        }
      }

      if (output.provider) {
        const provider = output.provider;

        if (this.providerService.isProvider(provider)) {
          this.setOutputService(key, provider);
        }
      }
    }
  }

  @mutation()
  private LOAD_OUTPUTS(store: any) {
    Object.assign(this.state, store);
  }

  @mutation()
  private ADD_OUTPUT(fOutput: FOutput) {
    Vue.set(this.state, fOutput.uniqueId, fOutput);
  }

  @mutation()
  private REMOVE_OUTPUT(uniqueId: string) {
    Vue.delete(this.state, uniqueId);
  }

  @mutation()
  private UPDATE_ENCODERS(
    uniqueId: string,
    audioEncoderId: string,
    videoEncoderId: string
  ) {
    const fOutput = this.state[uniqueId];

    if (!fOutput) {
      console.log(`State is bad!`);
      console.log(`${uniqueId}`);
      console.log(`${this.state.outputs}`);
    }

    fOutput.audioEncoder = audioEncoderId;
    fOutput.videoEncoder = videoEncoderId;
  }

  @mutation()
  private UPDATE_PROVIDER(uniqueId: string, providerId: string) {
    const fOutput = this.state[uniqueId];
    fOutput.provider = providerId;
  }

  @mutation()
  private START_OUTPUT(uniqueId: string) {
    const fOutput = this.state[uniqueId];
    fOutput.active = true;
  }

  @mutation()
  private STOP_OUTPUT(uniqueId: string) {
    const fOutput = this.state[uniqueId];
    fOutput.active = false;
  }

  addOutput(fOutput: FOutput) {
    this.ADD_OUTPUT(fOutput);

    const sObject = {
      type: fOutput.type,
      settings: fOutput.settings,
      audioEncoder: fOutput.audioEncoder,
      videoEncoder: fOutput.videoEncoder,
      provider: fOutput.provider
    };

    this.config.set(`${fOutput.uniqueId}`, sObject);
  }

  removeOutput(uniqueId: string) {
    /* Release directly to avoid a third map lookup. */
    const output = obs.OutputFactory.fromName(uniqueId);
    output.release();

    this.REMOVE_OUTPUT(uniqueId);

    this.config.delete(uniqueId);
  }

  startOutput(uniqueId: string) {
    const output = obs.OutputFactory.fromName(uniqueId);

    output.start();
    this.START_OUTPUT(uniqueId);
  }

  stopOutput(uniqueId: string) {
    const output = obs.OutputFactory.fromName(uniqueId);

    output.stop();
    this.STOP_OUTPUT(uniqueId);
  }

  setOutputEncoders(
    uniqueId: string,
    audioEncoderId: string,
    videoEncoderId: string
  ) {
    const audioEncoder = obs.AudioEncoderFactory.fromName(audioEncoderId);
    const videoEncoder = obs.VideoEncoderFactory.fromName(videoEncoderId);
    const output = obs.OutputFactory.fromName(uniqueId);

    output.setAudioEncoder(audioEncoder, 0);
    output.setVideoEncoder(videoEncoder);

    this.UPDATE_ENCODERS(uniqueId, audioEncoderId, videoEncoderId);
    this.config.set(`${uniqueId}.audioEncoder`, audioEncoderId);
    this.config.set(`${uniqueId}.videoEncoder`, videoEncoderId);
  }

  setOutputService(uniqueId: string, serviceId: string) {
    const service = obs.ServiceFactory.fromName(serviceId);
    const output = obs.OutputFactory.fromName(uniqueId);

    output.service = service;

    this.UPDATE_PROVIDER(uniqueId, serviceId);
    this.config.set(`${uniqueId}.provider`, serviceId);
  }

  isOutputActive(uniqueId: string): boolean {
    return this.state[uniqueId].active;
  }

  isOutput(uniqueId: string) {
    const obsOutput: obs.IOutput = obs.OutputFactory.fromName(uniqueId);

    if (obsOutput) return true;

    return false;
  }
}
