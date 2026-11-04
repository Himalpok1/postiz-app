import { Global, Module } from '@nestjs/common';
import { HubspotProvider } from '@gitroom/nestjs-libraries/3rdparties/hubspot/hubspot.provider';
import { ThirdPartyManager } from '@gitroom/nestjs-libraries/3rdparties/thirdparty.manager';

@Global()
@Module({
  providers: [
    HubspotProvider,
    ThirdPartyManager,
  ],
  get exports() {
    return this.providers;
  },
})
export class ThirdPartyModule {}
