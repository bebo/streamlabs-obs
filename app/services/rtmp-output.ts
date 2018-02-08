import { FOutput, OutputService } from './outputs';
import { FProvider, ProviderService } from './providers';
import { FAudioEncoder, FVideoEncoder, EncoderService } from './encoders';
import { StatefulService, mutation } from './stateful-service';
import { Inject } from 'util/injector';

const Config = require('electron-store');

/* A wrapper class that handles the global rtmp output 
 * and it's associated objects and state. */

interface RtmpOutputServiceState {
  rtmpOutputId: string;
}

export class RtmpOutputService extends StatefulService<RtmpOutputServiceState> {
  config = new Config({ name: 'RtmpOutputService' });

  @Inject() outputService: OutputService;
  @Inject() providerService: ProviderService;
  @Inject() encoderService: EncoderService;

  @mutation()
  UPDATE_OUTPUT(uniqueId: string) {
    this.state.rtmpOutputId = uniqueId;
  }

  init() {
    super.init();

    const rtmpOutputId = this.config.get('rtmpOutputId');

    if (rtmpOutputId) {
      if (this.outputService.isOutput(rtmpOutputId)) {
        this.UPDATE_OUTPUT(rtmpOutputId);
        return;
      }

      /* Invalid so just delete it. */
      this.config.delete('rtmpOutputId');
    }

    const outputId = OutputService.getUniqueId();
    /* FIXME Load persistent output settings here */
    const fOutput = new FOutput('rtmp_output', outputId);

    /* REMOVE ME These are hardcoded settings for my stream */
    const test_service_settings = {
      key: 'live_149172892_63LDVjr9p1kv3wLP9soqH1yHqctfmq',
      server: 'rtmp://live.twitch.tv/app',
      service: 'Twitch'
    };

    const providerId = ProviderService.getUniqueId();
    /* FIXME Load persistent service settings here */
    const provider = new FProvider(
      'rtmp_common',
      providerId,
      test_service_settings
    );

    const audioEncoderId = EncoderService.getUniqueId();
    /* FIXME Some logic on the best encoder to choose goes here */
    /* FIXME Load persistent settings here */
    const audioEncoder = new FAudioEncoder('mf_aac', audioEncoderId);

    const videoEncoderId = EncoderService.getUniqueId();
    /* FIXME Some logic on the best encoder to choose goes here */
    /* FIXME Load persistent settings here */
    const videoEncoder = new FVideoEncoder('obs_x264', videoEncoderId);

    this.providerService.addProvider(provider);
    this.encoderService.addAudioEncoder(audioEncoder);
    this.encoderService.addVideoEncoder(videoEncoder);
    this.outputService.addOutput(fOutput);

    this.outputService.setOutputService(outputId, providerId);
    this.outputService.setOutputEncoders(
      outputId,
      audioEncoderId,
      videoEncoderId
    );

    this.config.set('rtmpOutputId', outputId);
    this.UPDATE_OUTPUT(outputId);
  }

  serialize(): object {
    return {
      rtmpOutputId: this.state.rtmpOutputId
    };
  }

  start() {
    this.outputService.startOutput(this.state.rtmpOutputId);
  }

  stop() {
    this.outputService.stopOutput(this.state.rtmpOutputId);
  }

  isActive(): boolean {
    return this.outputService.isOutputActive(this.state.rtmpOutputId);
  }
}
