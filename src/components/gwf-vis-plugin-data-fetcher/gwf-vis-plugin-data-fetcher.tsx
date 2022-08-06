import { Component, Host, h, ComponentInterface, Prop, Method } from '@stencil/core';
import { GloablInfoDict, GwfVisPluginData } from '../../utils/gwf-vis-plugin';
import type { QueryExecResult } from 'sql.js';

@Component({
  tag: 'gwf-vis-plugin-data-fetcher',
  styleUrl: 'gwf-vis-plugin-data-fetcher.css',
  shadow: true,
})
export class GwfVisPluginDataFetcher implements ComponentInterface, GwfVisPluginData {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-data-fetcher';
  static readonly __PLUGIN_TYPE__ = 'data';

  private sqliteActionIdAndResolveMap = new Map<string, (value: any) => void>();
  private dbAndSqliteWorkerMap = new Map<string, Worker>();

  @Prop() leaflet: typeof globalThis.L;
  @Prop() fetchingDataDelegate: (query: any) => Promise<any>;
  @Prop() globalInfoDict: GloablInfoDict;
  @Prop() updatingGlobalInfoDelegate: (gloablInfoDict: GloablInfoDict) => void;
  @Prop() sqliteWorkerUrl: string;

  async componentDidLoad() {}

  @Method()
  async fetchData(query: any) {
    const dbUrl = query?.from;
    if (!dbUrl) {
      return undefined;
    }
    switch (query?.type) {
      case 'locations': {
        const [queryResult] =
          (await this.execSql(
            dbUrl,
            `
            select ${query?.for?.map(d => d).join(', ')}
            from location
            ${query?.with ? `where ${Object.entries(query?.with || {}).map(([key, value]) => `${key} = ${value}`)}` : ''}
            `,
          )) || [];
        const propertiesToParseJSON = ['geometry', 'metadata'];
        const result = queryResult?.values?.map(rowValues =>
          Object.fromEntries(
            rowValues.map((value, i) => [queryResult.columns?.[i], propertiesToParseJSON.includes(queryResult.columns[i]) ? JSON.parse(value.toString()) : value]),
          ),
        );
        return result;
      }
      case 'values': {
        let [queryResult] = (await this.execSql(dbUrl, `select id, name from variable where name = '${query?.with?.variableName}'`)) || [];
        const variableId = queryResult.values?.[0]?.[0];
        let dimensionIdAndValuePairs;
        if (query?.with?.dimensions) {
          const dimensionsEntries = Object.entries(query.with.dimensions);
          const dimensionNamesConnectedWithComma = dimensionsEntries.map(([dimensionName]) => `'${dimensionName}'`).join(', ');
          [queryResult] = await this.execSql(dbUrl, `select id, name from dimension where name in (${dimensionNamesConnectedWithComma})`);
          dimensionIdAndValuePairs = dimensionsEntries.map(([dimensionName, value]) => [queryResult.values.find(d => d[1] === dimensionName)?.[0], value]);
        }
        [queryResult] =
          (await this.execSql(
            dbUrl,
            `
            select ${query?.for?.map(d => d).join(', ')} 
            from value
            ${
              query?.with
                ? `where variable = ${variableId}${dimensionIdAndValuePairs ? ` and ${dimensionIdAndValuePairs.map(([key, value]) => `dimension_${key} = ${value}`)}` : ''}`
                : ''
            }
            `,
          )) || [];
        const result = queryResult?.values?.map(rowValues => Object.fromEntries(rowValues.map((value, i) => [queryResult.columns?.[i], value])));
        return result;
      }
      default:
        return undefined;
    }
  }

  render() {
    return <Host></Host>;
  }

  private async execSql(dbUrl: string, sql: string, params?: any) {
    return (
      await this.runSqlAction(await this.obtainSqliteWorker(dbUrl), {
        action: 'exec',
        sql,
        params,
      })
    ).results as QueryExecResult[];
  }

  private async obtainSqliteWorker(dbUrl: string) {
    const worker = this.dbAndSqliteWorkerMap.get(dbUrl);
    if (worker) {
      return worker;
    }
    const sqliteWorker = new Worker(this.sqliteWorkerUrl);
    sqliteWorker.addEventListener('message', ({ data }) => {
      const resolve = this.sqliteActionIdAndResolveMap.get(data.id.identifier);
      resolve?.(data);
      this.sqliteActionIdAndResolveMap?.delete(data.id.identifier);
    });
    this.dbAndSqliteWorkerMap.set(dbUrl, sqliteWorker);
    const response = await fetch(dbUrl);
    const dbBuffer = await response.arrayBuffer();
    return (
      (
        await this.runSqlAction(sqliteWorker, {
          action: 'open',
          buffer: dbBuffer,
        })
      )?.ready && sqliteWorker
    );
  }

  private runSqlAction(sqliteWorker: Worker, command: any) {
    const timeout = 20000;
    return new Promise<any>((resolve, reject) => {
      let id: string;
      do {
        id = Math.random().toString();
      } while (this.sqliteActionIdAndResolveMap.has(id));
      this.sqliteActionIdAndResolveMap.set(id, resolve);
      sqliteWorker?.postMessage({
        ...command,
        id: {
          identifier: id,
          action: command.action,
        },
      });
      setTimeout(() => {
        reject('action timeout');
      }, timeout);
    });
  }
}
