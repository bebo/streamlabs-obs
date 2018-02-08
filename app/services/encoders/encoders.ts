import { FAudioEncoder, FVideoEncoder } from './encoder';
import { StatefulService, mutation } from '../stateful-service';
import { ipcRenderer } from 'electron';
import { getConfigFilePath } from '../config';
import * as obs from '../obs-api';
import Vue from 'vue';

const Config = require('electron-store');

export interface IEncoderServiceState {
  audioEncoders: Dictionary<FAudioEncoder>;
  videoEncoders: Dictionary<FVideoEncoder>;
}

export class EncoderService extends StatefulService<IEncoderServiceState> {
  audioConfig = new Config({ name: 'AudioEncoders' });
  videoConfig = new Config({ name: 'VideoEncoders' });

  static initialState: IEncoderServiceState = {
    audioEncoders: {},
    videoEncoders: {}
  };

  static getUniqueId(): string {
    return 'encoder_' + ipcRenderer.sendSync('getUniqueId');
  }

  protected init() {
    super.init();

    const audioEncoders = this.audioConfig.store;
    const videoEncoders = this.videoConfig.store;

    this.LOAD_AUDIO_ENCODERS(audioEncoders);
    this.LOAD_VIDEO_ENCODERS(videoEncoders);

    for (const key in audioEncoders) {
      const name = key;
      const type = audioEncoders[key].type;
      const settings = audioEncoders[key].settings;

      audioEncoders[key].uniqueId = key;
      FAudioEncoder.init(type, name, settings);
    }

    for (const key in videoEncoders) {
      const name = key;
      const type = videoEncoders[key].type;
      const settings = videoEncoders[key].settings;

      videoEncoders[key].uniqueId = key;
      FVideoEncoder.init(type, name, settings);
    }
  }

  @mutation()
  private LOAD_AUDIO_ENCODERS(store: any) {
    Object.assign(this.state.audioEncoders, store);
  }

  @mutation()
  private LOAD_VIDEO_ENCODERS(store: any) {
    Object.assign(this.state.videoEncoders, store);
  }

  @mutation()
  ADD_AUDIO_ENCODER(encoder: FAudioEncoder) {
    Vue.set(this.state.audioEncoders, encoder.uniqueId, encoder);
  }

  @mutation()
  ADD_VIDEO_ENCODER(encoder: FVideoEncoder) {
    Vue.set(this.state.videoEncoders, encoder.uniqueId, encoder);
  }

  @mutation()
  REMOVE_AUDIO_ENCODER(uniqueId: string) {
    Vue.delete(this.state.audioEncoders, uniqueId);
  }

  @mutation()
  REMOVE_VIDEO_ENCODER(uniqueId: string) {
    Vue.delete(this.state.videoEncoders, uniqueId);
  }

  addAudioEncoder(encoder: FAudioEncoder) {
    this.ADD_AUDIO_ENCODER(encoder);

    const sObject = {
      type: encoder.type,
      settings: encoder.settings
    };

    this.audioConfig.set(encoder.uniqueId, sObject);
  }

  addVideoEncoder(encoder: FVideoEncoder) {
    this.ADD_VIDEO_ENCODER(encoder);

    const sObject = {
      type: encoder.type,
      settings: encoder.settings
    };

    this.videoConfig.set(encoder.uniqueId, sObject);
  }

  removeAudioEncoder(uniqueId: string) {
    const encoder = obs.AudioEncoderFactory.fromName(uniqueId);
    encoder.release();

    this.REMOVE_AUDIO_ENCODER(uniqueId);
    this.audioConfig.delete(uniqueId);
  }

  removeVideoEncoder(uniqueId: string) {
    const encoder = obs.AudioEncoderFactory.fromName(uniqueId);
    encoder.release();

    this.REMOVE_VIDEO_ENCODER(uniqueId);
    this.videoConfig.delete(uniqueId);
  }

  isAudioEncoder(uniqueId: string) {
    const obsEncoder: obs.IAudioEncoder = obs.AudioEncoderFactory.fromName(
      uniqueId
    );

    if (obsEncoder) return true;

    return false;
  }

  isVideoEncoder(uniqueId: string) {
    const obsEncoder: obs.IVideoEncoder = obs.VideoEncoderFactory.fromName(
      uniqueId
    );

    if (obsEncoder) return true;

    return false;
  }
}
