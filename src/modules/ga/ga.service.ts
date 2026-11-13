import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { BetaAnalyticsDataClient, protos } from '@google-analytics/data';
import { ConfigService } from '@nestjs/config';
import { AllConfig } from '../../config/config.type';
import type {
  GaGranularity,
  GaReportQueryDto,
} from './dto/ga-report-query.dto';

type Row = {
  dimensionValues?: Array<{ value?: string | null }> | null;
  metricValues?: Array<{ value?: string | null }> | null;
};

type ReportResponse = {
  rows?: Row[] | null;
  totals?: Row[] | null;
};

type DateRange = { startDate: string; endDate: string };

type RunReportRequest = protos.google.analytics.data.v1beta.IRunReportRequest;

type MetricSummary = { value: number; delta: number | null };

type TimeseriesPoint = {
  date: string;
  hour: string | null;
  label: string;
};

type RequestPoint = TimeseriesPoint & {
  requests: number;
  pageviews: number;
  visits: number;
};

type VisitorPoint = TimeseriesPoint & {
  pageviews: number;
  visits: number;
  users: number;
};

type PerformancePoint = TimeseriesPoint & {
  avgEngagementTime: number;
  engagementRate: number;
  bounceRate: number;
  sessions: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class GaService {
  private readonly logger = new Logger(GaService.name);
  private client?: BetaAnalyticsDataClient;

  constructor(private readonly configService: ConfigService<AllConfig>) {}

  async getRequests(query: GaReportQueryDto) {
    const { range, granularity } = this.resolveRange(query);
    const previous = this.previousRange(range);
    const dimensions = this.timeDimensions(granularity);

    const [totals, timeseries, byPage, bySource, byDevice] = await Promise.all([
      this.getTotals(range, previous, [
        'eventCount',
        'screenPageViews',
        'sessions',
      ]),
      this.runReport({
        dateRanges: [range],
        dimensions,
        metrics: [
          { name: 'eventCount' },
          { name: 'screenPageViews' },
          { name: 'sessions' },
        ],
      }),
      this.runReport({
        dateRanges: [range],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'eventCount' }, { name: 'screenPageViews' }],
        limit: 10,
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      }),
      this.runReport({
        dateRanges: [range],
        dimensions: [{ name: 'sessionSource' }],
        metrics: [{ name: 'sessions' }],
        limit: 8,
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),
      this.runReport({
        dateRanges: [range],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'sessions' }],
        limit: 5,
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),
    ]);

    const points: RequestPoint[] = this.sortRows(timeseries.rows ?? []).map(
      (row) => {
        const { date, hour, label } = this.timeLabel(row, granularity);
        return {
          date,
          hour,
          label,
          requests: this.metric(row, 0),
          pageviews: this.metric(row, 1),
          visits: this.metric(row, 2),
        };
      },
    );

    return {
      range: { ...range, granularity },
      summary: {
        requests: this.summary(totals[0], totals[3]),
        pageviews: this.summary(totals[1], totals[4]),
        visits: this.summary(totals[2], totals[5]),
      },
      timeseries: points,
      byPage: (byPage.rows ?? []).map((row) => ({
        path: this.dimension(row, 0) || '/',
        requests: this.metric(row, 0),
        pageviews: this.metric(row, 1),
      })),
      bySource: (bySource.rows ?? []).map((row) => ({
        source: this.dimension(row, 0) || '(direct)',
        visits: this.metric(row, 0),
      })),
      byDevice: (byDevice.rows ?? []).map((row) => ({
        device: this.dimension(row, 0) || 'unknown',
        visits: this.metric(row, 0),
      })),
    };
  }

  async getVisitors(query: GaReportQueryDto) {
    const { range, granularity } = this.resolveRange(query);
    const previous = this.previousRange(range);
    const dimensions = this.timeDimensions(granularity);

    const [totals, timeseries, countries, topPages, devices] =
      await Promise.all([
        this.getTotals(range, previous, [
          'screenPageViews',
          'sessions',
          'totalUsers',
          'newUsers',
        ]),
        this.runReport({
          dateRanges: [range],
          dimensions,
          metrics: [
            { name: 'screenPageViews' },
            { name: 'sessions' },
            { name: 'totalUsers' },
          ],
        }),
        this.runReport({
          dateRanges: [range],
          dimensions: [{ name: 'country' }],
          metrics: [{ name: 'totalUsers' }, { name: 'screenPageViews' }],
          limit: 10,
          orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
        }),
        this.runReport({
          dateRanges: [range],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }, { name: 'totalUsers' }],
          limit: 10,
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        }),
        this.runReport({
          dateRanges: [range],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'totalUsers' }],
          limit: 5,
          orderBys: [{ metric: { metricName: 'totalUsers' }, desc: true }],
        }),
      ]);

    const points: VisitorPoint[] = this.sortRows(timeseries.rows ?? []).map(
      (row) => {
        const { date, hour, label } = this.timeLabel(row, granularity);
        return {
          date,
          hour,
          label,
          pageviews: this.metric(row, 0),
          visits: this.metric(row, 1),
          users: this.metric(row, 2),
        };
      },
    );

    return {
      range: { ...range, granularity },
      summary: {
        pageviews: this.summary(totals[0], totals[4]),
        visits: this.summary(totals[1], totals[5]),
        users: this.summary(totals[2], totals[6]),
        newUsers: this.summary(totals[3], totals[7]),
      },
      timeseries: points,
      countries: (countries.rows ?? []).map((row) => ({
        country: this.dimension(row, 0) || 'Unknown',
        users: this.metric(row, 0),
        pageviews: this.metric(row, 1),
      })),
      topPages: (topPages.rows ?? []).map((row) => ({
        path: this.dimension(row, 0) || '/',
        pageviews: this.metric(row, 0),
        users: this.metric(row, 1),
      })),
      devices: (devices.rows ?? []).map((row) => ({
        device: this.dimension(row, 0) || 'unknown',
        users: this.metric(row, 0),
      })),
    };
  }

  async getPerformance(query: GaReportQueryDto) {
    const { range, granularity } = this.resolveRange(query);
    const previous = this.previousRange(range);
    const dimensions = this.timeDimensions(granularity);

    const [totals, timeseries, byPage, byDevice] = await Promise.all([
      this.getTotals(range, previous, [
        'averageSessionDuration',
        'engagementRate',
        'bounceRate',
        'sessions',
      ]),
      this.runReport({
        dateRanges: [range],
        dimensions,
        metrics: [
          { name: 'averageSessionDuration' },
          { name: 'engagementRate' },
          { name: 'bounceRate' },
          { name: 'sessions' },
        ],
      }),
      this.runReport({
        dateRanges: [range],
        dimensions: [{ name: 'pagePath' }],
        metrics: [
          { name: 'averageSessionDuration' },
          { name: 'engagementRate' },
          { name: 'screenPageViews' },
        ],
        limit: 10,
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      }),
      this.runReport({
        dateRanges: [range],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [
          { name: 'averageSessionDuration' },
          { name: 'engagementRate' },
          { name: 'sessions' },
        ],
        limit: 5,
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),
    ]);

    const points: PerformancePoint[] = this.sortRows(timeseries.rows ?? []).map(
      (row) => {
        const { date, hour, label } = this.timeLabel(row, granularity);
        return {
          date,
          hour,
          label,
          avgEngagementTime: this.round(this.metric(row, 0), 1),
          engagementRate: this.round(this.metric(row, 1) * 100, 1),
          bounceRate: this.round(this.metric(row, 2) * 100, 1),
          sessions: this.metric(row, 3),
        };
      },
    );

    const avgEngagement = this.rate(totals[0], totals[4], (value) =>
      this.round(value, 1),
    );
    const engagementRate = this.rate(totals[1], totals[5], (value) =>
      this.round(value * 100, 1),
    );
    const bounceRate = this.rate(totals[2], totals[6], (value) =>
      this.round(value * 100, 1),
    );
    const sessions = this.summary(totals[3], totals[7]);

    return {
      range: { ...range, granularity },
      summary: {
        avgEngagementTime: avgEngagement,
        engagementRate,
        bounceRate,
        sessions,
      },
      timeseries: points,
      byPage: (byPage.rows ?? []).map((row) => ({
        path: this.dimension(row, 0) || '/',
        avgEngagementTime: this.round(this.metric(row, 0), 1),
        engagementRate: this.round(this.metric(row, 1) * 100, 1),
        pageviews: this.metric(row, 2),
      })),
      byDevice: (byDevice.rows ?? []).map((row) => ({
        device: this.dimension(row, 0) || 'unknown',
        avgEngagementTime: this.round(this.metric(row, 0), 1),
        engagementRate: this.round(this.metric(row, 1) * 100, 1),
        visits: this.metric(row, 2),
      })),
    };
  }

  // ── Google Analytics plumbing ─────────────────────────────────────────────

  private getClient(): BetaAnalyticsDataClient {
    if (this.client) return this.client;

    const credentials = this.configService.get('app.gaCredentials', {
      infer: true,
    });
    const keyFile = this.configService.get('app.gaKeyFile', { infer: true });

    if (credentials) {
      try {
        const raw = credentials.trim().startsWith('{')
          ? credentials
          : Buffer.from(credentials, 'base64').toString('utf8');
        const parsed = JSON.parse(raw) as {
          private_key?: string;
          [key: string]: unknown;
        };
        if (parsed.private_key) {
          parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
        }
        this.client = new BetaAnalyticsDataClient({
          credentials: parsed as Record<string, unknown>,
        });
      } catch (error) {
        this.logger.error(
          'GA_CREDENTIALS could not be parsed',
          (error as Error)?.stack,
        );
        throw new ServiceUnavailableException(
          'Google Analytics credentials are invalid',
        );
      }
    } else {
      this.client = new BetaAnalyticsDataClient({ keyFilename: keyFile });
    }

    return this.client;
  }

  private async runReport(request: RunReportRequest): Promise<ReportResponse> {
    const propertyId = this.configService.get('app.gaPropertyId', {
      infer: true,
    });
    if (!propertyId) {
      throw new ServiceUnavailableException('GA_PROPERTY_ID is not configured');
    }

    try {
      const [response] = await this.getClient().runReport({
        ...request,
        property: `properties/${propertyId}`,
      });
      return response;
    } catch (error) {
      this.logger.error(
        'Google Analytics report failed',
        (error as Error)?.stack,
      );
      throw new ServiceUnavailableException(
        'Google Analytics is unavailable right now',
      );
    }
  }

  /**
   * Runs the same metrics over the current and the immediately preceding
   * period in a single request. GA returns one totals row per date range.
   */
  private async getTotals(
    current: DateRange,
    previous: DateRange,
    metrics: string[],
  ): Promise<number[]> {
    const response = await this.runReport({
      dateRanges: [current, previous],
      metrics: metrics.map((name) => ({ name })),
    });

    // With multiple date ranges GA injects a `dateRange` dimension and returns
    // one row per range (and an empty `totals` array), so prefer `totals` when
    // present and fall back to those rows.
    const rows =
      response.totals && response.totals.length > 0
        ? response.totals
        : (response.rows ?? []);
    const values: number[] = [];

    metrics.forEach((_, index) => {
      values.push(this.metric(rows[0], index));
    });
    metrics.forEach((_, index) => {
      values.push(this.metric(rows[1], index));
    });

    return values;
  }

  private resolveRange(query: GaReportQueryDto): {
    range: DateRange;
    granularity: GaGranularity;
  } {
    const endDate = query.endDate ?? this.toIso(new Date());
    const startDate = query.startDate ?? this.toIso(this.addDays(endDate, -29));

    if (startDate > endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    return {
      range: { startDate, endDate },
      granularity: query.granularity ?? 'day',
    };
  }

  private previousRange(range: DateRange): DateRange {
    const days = this.daysBetween(range.startDate, range.endDate);
    const endDate = this.toIso(this.addDays(range.startDate, -1));
    const startDate = this.toIso(this.addDays(endDate, -(days - 1)));
    return { startDate, endDate };
  }

  private timeDimensions(granularity: GaGranularity): Array<{ name: string }> {
    return granularity === 'hour'
      ? [{ name: 'date' }, { name: 'hour' }]
      : [{ name: 'date' }];
  }

  private sortRows(rows: Row[]): Row[] {
    return [...rows].sort((a, b) => {
      const dateA = this.dimension(a, 0);
      const dateB = this.dimension(b, 0);
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (
        Number(this.dimension(a, 1) || 0) - Number(this.dimension(b, 1) || 0)
      );
    });
  }

  private timeLabel(
    row: Row,
    granularity: GaGranularity,
  ): { date: string; hour: string | null; label: string } {
    const rawDate = this.dimension(row, 0);
    const date =
      rawDate.length === 8
        ? `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`
        : rawDate;
    if (granularity !== 'hour') return { date, hour: null, label: date };

    const hour = String(Number(this.dimension(row, 1) || 0)).padStart(2, '0');
    return { date, hour, label: `${date} ${hour}:00` };
  }

  private dimension(row: Row | undefined, index: number): string {
    return row?.dimensionValues?.[index]?.value ?? '';
  }

  private metric(row: Row | undefined, index: number): number {
    const value = Number(row?.metricValues?.[index]?.value ?? 0);
    return Number.isFinite(value) ? value : 0;
  }

  private summary(
    current: number | undefined,
    previous: number | undefined,
  ): MetricSummary {
    const value = current ?? 0;
    const before = previous ?? 0;

    if (before === 0) {
      return { value, delta: value === 0 ? 0 : null };
    }

    return {
      value,
      delta: this.round(((value - before) / before) * 100, 1),
    };
  }

  private rate(
    current: number | undefined,
    previous: number | undefined,
    transform: (value: number) => number,
  ): MetricSummary {
    const summary = this.summary(current, previous);
    return { ...summary, value: transform(summary.value) };
  }

  private round(value: number, decimals: number): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
  }

  private addDays(isoDate: string, days: number): Date {
    return new Date(Date.parse(`${isoDate}T00:00:00Z`) + days * DAY_MS);
  }

  private daysBetween(startDate: string, endDate: string): number {
    const start = Date.parse(`${startDate}T00:00:00Z`);
    const end = Date.parse(`${endDate}T00:00:00Z`);
    return Math.max(1, Math.round((end - start) / DAY_MS) + 1);
  }

  private toIso(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
