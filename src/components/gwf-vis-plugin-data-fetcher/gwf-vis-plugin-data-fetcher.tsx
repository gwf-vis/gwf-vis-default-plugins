import { Component, Host, h, ComponentInterface, Prop, Method } from '@stencil/core';
import { GloablInfoDict, GwfVisPluginData } from '../../utils/gwf-vis-plugin';
import type { QueryExecResult } from 'sql.js';

export type DbHelper = {
  worker?: Worker;
  variableNameAndIdDict?: { [name: string]: string };
  dimensionNameAndIdDict?: { [name: string]: string };
};

@Component({
  tag: 'gwf-vis-plugin-data-fetcher',
  styleUrl: 'gwf-vis-plugin-data-fetcher.css',
  shadow: true,
})
export class GwfVisPluginDataFetcher implements ComponentInterface, GwfVisPluginData {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-data-fetcher';
  static readonly __PLUGIN_TYPE__ = 'data';

  private sqliteActionIdAndResolveMap = new Map<string, (value: any) => void>();
  private dbIdAndHelperMap = new Map<string, DbHelper>();

  @Prop() leaflet: typeof globalThis.L;
  @Prop() fetchingDataDelegate: (query: any) => Promise<any>;
  @Prop() globalInfoDict: GloablInfoDict;
  @Prop() updatingGlobalInfoDelegate: (gloablInfoDict: GloablInfoDict) => void;
  @Prop() sqliteWorkerUrl: string;

  @Method()
  async fetchData(query: any) {
    const dbUrl = query?.from;
    if (!dbUrl) {
      return undefined;
    }
    const dbWorker = await this.obtainDbWorker(dbUrl);
    switch (query?.type) {
      case 'locations': {
        const [queryResult] =
          (await this.execSql(
            dbWorker,
            `
            select ${query?.for?.map(d => d).join(', ')}
            from location
            ${query?.with ? `where ${Object.entries(query?.with || {}).map(([key, value]) => `${key} = ${value}`)}` : ''}
            `,
          )) || [];
        const propertiesToParseJSON = ['geometry', 'metadata'];
        const result = queryResult?.values?.map(rowValues =>
          Object.fromEntries(
            rowValues.map((value, i) => [queryResult.columns?.[i], propertiesToParseJSON.includes(queryResult.columns[i]) ? value && JSON.parse(value.toString()) : value]),
          ),
        );
        return result;
      }
      case 'values': {
        const { variableNameAndIdDict, dimensionNameAndIdDict } = this.dbIdAndHelperMap.get(dbUrl) || {};
        const variableId = variableNameAndIdDict?.[query?.with?.variableName];
        let dimensionIdAndValuePairs;
        if (query?.with?.dimensions) {
          const dimensionsEntries = Object.entries(query.with.dimensions);
          dimensionIdAndValuePairs = dimensionsEntries.map(([dimensionName, value]) => [dimensionNameAndIdDict?.[dimensionName], value]);
        }
        let [queryResult] =
          (await this.execSql(
            dbWorker,
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
      case 'variables': {
        const [queryResult] = (await this.execSql(dbWorker, 'select * from variable')) || [];
        const propertiesToParseJSON = [];
        const result = queryResult?.values?.map(rowValues =>
          Object.fromEntries(
            rowValues.map((value, i) => [queryResult.columns?.[i], propertiesToParseJSON.includes(queryResult.columns[i]) ? value && JSON.parse(value.toString()) : value]),
          ),
        );
        return result;
      }
      case 'dimensions': {
        const [queryResult] = (await this.execSql(dbWorker, 'select * from dimension')) || [];
        const propertiesToParseJSON = ['value_labels'];
        const result = queryResult?.values?.map(rowValues =>
          Object.fromEntries(
            rowValues.map((value, i) => [queryResult.columns?.[i], propertiesToParseJSON.includes(queryResult.columns[i]) ? value && JSON.parse(value.toString()) : value]),
          ),
        );
        return result;
      }
      default:
        return undefined;
    }
  }

  render() {
    return <Host></Host>;
  }

  private async execSql(dbWorker: Worker, sql: string, params?: any) {
    return (
      await this.runSqlAction(dbWorker, {
        action: 'exec',
        sql,
        params,
      })
    ).results as QueryExecResult[];
  }

  private async obtainDbWorker(dbUrl: string) {
    const worker = this.dbIdAndHelperMap.get(dbUrl)?.worker;
    if (worker) {
      return worker;
    }
    const dbWorker = new Worker(this.sqliteWorkerUrl);
    dbWorker.addEventListener('message', ({ data }) => {
      const resolve = this.sqliteActionIdAndResolveMap.get(data.id.identifier);
      resolve?.(data);
      this.sqliteActionIdAndResolveMap?.delete(data.id.identifier);
    });
    const response = await fetch(dbUrl);
    const dbBuffer = await response.arrayBuffer();
    const dbReady = (
      await this.runSqlAction(dbWorker, {
        action: 'open',
        buffer: dbBuffer,
      })
    )?.ready;
    let [queryResult] = (await this.execSql(dbWorker, 'select name, id from variable')) || [];
    const variableNameAndIdDict = Object.fromEntries(queryResult?.values || []);
    [queryResult] = (await this.execSql(dbWorker, 'select name, id from dimension')) || [];
    const dimensionNameAndIdDict = Object.fromEntries(queryResult?.values || []);
    this.dbIdAndHelperMap.set(dbUrl, {
      worker: dbWorker,
      variableNameAndIdDict,
      dimensionNameAndIdDict,
    });
    return dbReady ? dbWorker : undefined;
  }

  private runSqlAction(dbWorker: Worker, command: any) {
    const timeout = 20000;
    return new Promise<any>((resolve, reject) => {
      let id: string;
      do {
        id = Math.random().toString();
      } while (this.sqliteActionIdAndResolveMap.has(id));
      this.sqliteActionIdAndResolveMap.set(id, resolve);
      dbWorker?.postMessage({
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
