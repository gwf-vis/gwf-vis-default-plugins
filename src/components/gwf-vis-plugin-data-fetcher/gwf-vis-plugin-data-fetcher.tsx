import { Component, Host, h, ComponentInterface, Prop, Method } from '@stencil/core';
import { GwfVisPluginData } from '../../utils/gwf-vis-plugin';
import type { QueryExecResult } from 'sql.js';

export type DbHelper = {
  worker?: Worker;
  variableNameAndIdDict?: { [name: string]: number };
  dimensionNameAndIdDict?: { [name: string]: number };
};

@Component({
  tag: 'gwf-vis-plugin-data-fetcher',
  styleUrl: 'gwf-vis-plugin-data-fetcher.css',
  shadow: true,
})
export class GwfVisPluginDataFetcher implements ComponentInterface, GwfVisPluginData {
  static readonly __PLUGIN_TAG_NAME__ = 'gwf-vis-plugin-data-fetcher';

  private sqliteActionIdAndResolveMap = new Map<string, (value: any) => void>();
  private dbIdAndHelperMap = new Map<string, DbHelper>();

  @Prop() sqliteWorkerUrl: string;
  @Prop() remoteSqlRunnerUrl: string;

  @Method()
  async obtainHeader() {
    return 'Data Fetcher';
  }

  @Method()
  async fetchData(query: any) {
    const dbUrl = query?.from;
    if (!dbUrl) {
      return undefined;
    }
    const dbWorker = await this.obtainDbWorker(dbUrl);
    switch (query?.type) {
      case 'locations': {
        const queryResult =
          (await this.execSql(
            dbWorker || dbUrl,
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
        const locationIds = [];
        const locationIdOrIds = query?.with?.location;
        if (Array.isArray(locationIdOrIds)) {
          locationIdOrIds.forEach(locationId => locationIds.push(locationId));
        } else if (locationIdOrIds) {
          locationIds.push(locationIdOrIds);
        }
        const variableIds = [];
        const variableNameOrNames = query?.with?.variable;
        if (Array.isArray(variableNameOrNames)) {
          variableNameOrNames.forEach(variableName => variableIds.push(variableNameAndIdDict?.[variableName]));
        } else {
          const variableId = variableNameAndIdDict?.[variableNameOrNames];
          if (typeof variableId === 'number') {
            variableIds.push(variableId);
          }
        }
        let dimensionIdAndValuePairs = [];
        if (query?.with?.dimensions) {
          const dimensionsEntries = Object.entries(query.with.dimensions);
          dimensionIdAndValuePairs = dimensionsEntries.map(([dimensionName, value]) => [dimensionNameAndIdDict?.[dimensionName], value]);
        }

        const selectClause = query?.for
          ?.map((columnName: string) => {
            if (columnName.startsWith('dimension_')) {
              const dimensionName = columnName.substring('dimension_'.length);
              const dimensionId = dimensionNameAndIdDict?.[dimensionName];
              columnName = `dimension_${dimensionId}`;
            }
            return columnName;
          })
          .join(', ');

        const whereClauses = [];
        if (locationIds.length > 0) {
          whereClauses.push(`location in (${locationIds.join(', ')})`);
        }
        if (variableIds.length > 0) {
          whereClauses.push(`variable in (${variableIds.join(', ')})`);
        }
        if (dimensionIdAndValuePairs.length > 0) {
          whereClauses.push(dimensionIdAndValuePairs.map(([key, value]) => `dimension_${key} ${typeof value === 'number' ? `= ${value}` : 'is NULL'}`).join(' and '));
        }

        let queryResult =
          (await this.execSql(
            dbWorker || dbUrl,
            `
            select ${selectClause} 
            from value
            where ${whereClauses.join(' and ')}
            `,
          )) || [];
        const result = queryResult?.values?.map(rowValues =>
          Object.fromEntries(
            rowValues.map((value, i) => {
              let columnName = queryResult.columns?.[i];
              if (columnName === 'variable') {
                value = Object.entries(variableNameAndIdDict || {}).find(([_, id]) => value === id)?.[0];
              } else if (columnName.startsWith('dimension_')) {
                const dimensionId = +columnName.substring('dimension_'.length);
                columnName = Object.entries(dimensionNameAndIdDict || {}).find(([_, id]) => dimensionId === id)?.[0];
              }
              return [columnName, value];
            }),
          ),
        );
        return result;
      }
      case 'variables': {
        let queryResult = (await this.execSql(dbWorker || dbUrl, 'select * from variable')) || [];
        const propertiesToParseJSON = [];
        const result = queryResult?.values?.map(rowValues =>
          Object.fromEntries(
            rowValues.map((value, i) => [queryResult.columns?.[i], propertiesToParseJSON.includes(queryResult.columns[i]) ? value && JSON.parse(value.toString()) : value]),
          ),
        );
        queryResult = (await this.execSql(dbWorker || dbUrl, 'select variable, dimension from variable_dimension')) || [];
        result.forEach(
          variable =>
            (variable['dimensions'] = queryResult?.values
              ?.filter(([variableId]) => variableId === variable['id'])
              .map(([_, dimensionId]) => Object.entries(this.dbIdAndHelperMap.get(dbUrl)?.dimensionNameAndIdDict || {}).find(([_, id]) => id === dimensionId)?.[0])),
        );
        return result;
      }
      case 'dimensions': {
        const queryResult = (await this.execSql(dbWorker || dbUrl, 'select * from dimension')) || [];
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

  private async execSql(dbWorkerOrUrl: Worker | string, sql: string) {
    let result;
    if (typeof dbWorkerOrUrl === 'string') {
      result = await this.execSqlRemote(dbWorkerOrUrl, sql);
    } else {
      [result] = await this.execSqlLocal(dbWorkerOrUrl, sql);
    }
    return result;
  }

  private async execSqlRemote(path: string, sql: string) {
    const response = await fetch(`${this.remoteSqlRunnerUrl}?path=${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql }),
    });
    return await response.json();
  }

  private async execSqlLocal(dbWorker: Worker, sql: string) {
    return (
      await this.runSqlAction(dbWorker, {
        action: 'exec',
        sql,
      })
    ).results as QueryExecResult[];
  }

  private async obtainDbWorker(dbUrl: string) {
    let dbWorker: Worker;
    let dbReady: boolean;
    if (!dbUrl?.startsWith('@')) {
      const helper = this.dbIdAndHelperMap.get(dbUrl);
      if (helper) {
        const obtainDbWorkerWhenReady = () => {
          const timeout = 100;
          return new Promise(resolve => {
            const helper = this.dbIdAndHelperMap.get(dbUrl);
            if (helper.variableNameAndIdDict && helper.dimensionNameAndIdDict) {
              resolve(helper.worker);
            } else {
              setTimeout(async () => {
                resolve(await obtainDbWorkerWhenReady());
              }, timeout);
            }
          });
        };
        return (await obtainDbWorkerWhenReady()) as Worker;
      }
      dbWorker = new Worker(this.sqliteWorkerUrl);
      this.dbIdAndHelperMap.set(dbUrl, {
        worker: dbWorker,
      });
      dbWorker.addEventListener('message', ({ data }) => {
        const resolve = this.sqliteActionIdAndResolveMap.get(data.id.identifier);
        resolve?.(data);
        this.sqliteActionIdAndResolveMap?.delete(data.id.identifier);
      });
      const response = await fetch(dbUrl);
      const dbBuffer = await response.arrayBuffer();
      dbReady = (
        await this.runSqlAction(dbWorker, {
          action: 'open',
          buffer: dbBuffer,
        })
      )?.ready;
    }
    let queryResult = (await this.execSql(dbWorker || dbUrl, 'select name, id from variable')) || [];
    const variableNameAndIdDict = Object.fromEntries(queryResult?.values || []);
    queryResult = (await this.execSql(dbWorker || dbUrl, 'select name, id from dimension')) || [];
    const dimensionNameAndIdDict = Object.fromEntries(queryResult?.values || []);
    this.dbIdAndHelperMap.set(dbUrl, {
      worker: dbWorker,
      variableNameAndIdDict,
      dimensionNameAndIdDict,
    });
    return dbReady ? dbWorker : undefined;
  }

  private obtainDbWorkerWhenReady(dbUrl: string) {
    return new Promise(resolve => {
      const helper = this.dbIdAndHelperMap.get(dbUrl);
      if (helper.variableNameAndIdDict && helper.dimensionNameAndIdDict) {
        resolve(helper.worker);
      } else {
        const timeout = 100;
        setTimeout(async () => {
          resolve(await this.obtainDbWorkerWhenReady(dbUrl));
        }, timeout);
      }
    });
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
