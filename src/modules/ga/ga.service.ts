import { Injectable } from '@nestjs/common';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { ConfigService } from '@nestjs/config';
import { AllConfig } from 'src/config/config.type';

@Injectable()
export class GaService {
  private readonly analyticsDataClient: BetaAnalyticsDataClient =
    new BetaAnalyticsDataClient({
      keyFilename: 'GAServiceKey.json',
    });

  constructor(private readonly configService: ConfigService<AllConfig>) {}

  findAll() {
    const gaPropertyId = this.configService.get('app.gaPropertyId', {
      infer: true,
    });
    const response = this.analyticsDataClient.runReport({
      property: `properties/${gaPropertyId}`,
    });

    return response;
  }
}
