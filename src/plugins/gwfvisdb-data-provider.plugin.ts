import type {
  VGADataProviderPlugin,
  VGAPlugin,
  VGAPluginWithData,
  VGAPluginWithSharedStates,
  SharedStates,
} from "vga-core";
import { html, css, LitElement } from "lit";
import { runAsyncWithLoading } from "../utils/basic";
import { SqlValue } from "sql.js";
import {
  Dimension,
  Location,
  GWFVisDBQueryObject,
  Variable,
  VariableWithDimensions,
} from "../utils/data";
import { GWFVisDefaultPluginSharedStates } from "../utils/state";

export default class GWFVisPluginGWFVisDBDataProvider
  extends LitElement
  implements
  VGAPlugin,
  VGADataProviderPlugin<GWFVisDBQueryObject, any>,
  VGAPluginWithSharedStates,
  VGAPluginWithData<string, initSqlJs.QueryExecResult | undefined> {
  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
    }

    * {
      box-sizing: border-box;
    }
  `;

  sharedStates?: GWFVisDefaultPluginSharedStates;

  checkIfDataProviderRegisteredDelegate?:
    | ((identifier: string) => boolean)
    | undefined;
  queryDataDelegate?:
    | ((
      dataSource: string,
      queryObject: string
    ) => Promise<initSqlJs.QueryExecResult | undefined>)
    | undefined;

  notifyLoadingDelegate?: () => () => void;

  updateSharedStatesDelegate?:
    | ((sharedStates: SharedStates) => void)
    | undefined;

  obtainHeaderCallback = () => `GWFVisDB Data Provider`;

  obtainDataProviderIdentifiersCallback = () => ["gwfvisdb"];

  async queryDataCallback(
    _identifier: string,
    dataSource: string,
    queryObject: GWFVisDBQueryObject
  ) {
    if (!dataSource || !queryObject) {
      return undefined;
    }
    if (!this.checkIfDataProviderRegisteredDelegate?.("sqlite-local")) {
      alert(`"sqlite-local" data provider is required.`);
      return undefined;
    }
    const dataSourceForSqliteLocal = `sqlite-local:${dataSource}`;
    const result = await runAsyncWithLoading(async () => {
      switch (queryObject.for) {
        case "locations":
          return await this.queryLocations(
            dataSourceForSqliteLocal,
            queryObject.filter
          );
        case "dimensions":
          return await this.queryDimensions(
            dataSourceForSqliteLocal,
            queryObject.filter
          );
        case "variables":
          return await this.queryVariables(
            dataSource,
            dataSourceForSqliteLocal,
            queryObject.filter
          );
        case "max-min-value":
          return await this.queryMaxAndMinValue(
            dataSourceForSqliteLocal,
            queryObject.filter
          );
        case "values":
          return await this.queryValues(
            dataSource,
            dataSourceForSqliteLocal,
            queryObject.filter
          );
        default:
          return undefined;
      }
    }, this);
    return result;
  }

  render() {
    return html`<i>gwfvisdb</i> Data Provider`;
  }

  private async queryLocations(
    dataSourceForSqliteLocal: string,
    filter?: { ids?: number[] }
  ) {
    let whereClause = "";
    if (filter?.ids) {
      whereClause = `WHERE id IN (${filter.ids.join(", ")})`;
    }
    const sql = `SELECT id, geometry, metadata FROM location ${whereClause}`;
    const sqlResult = await this.queryDataDelegate?.(
      dataSourceForSqliteLocal,
      sql
    );
    const locations = sqlResult?.values?.map(
      (d) =>
        Object.fromEntries(
          d?.map((value, columnIndex) => {
            const columnName = sqlResult?.columns?.[columnIndex];
            if (columnName === "geometry" || columnName === "metadata") {
              value = value ? JSON.parse(value as string) : undefined;
            }
            return [columnName, value as any];
          })
        ) as Location
    );
    return locations;
  }

  private async queryDimensions(
    dataSourceForSqliteLocal: string,
    filter?: { ids?: number[]; names?: string[] }
  ) {
    const idConditionClause = filter?.ids
      ? `id IN (${filter.ids.join(", ")})`
      : "";
    const nameConditionClause = filter?.names
      ? `name IN (${filter.names.join(", ")})`
      : "";
    let whereClause = [idConditionClause, nameConditionClause]
      .filter(Boolean)
      .join(" AND ");
    if (whereClause) {
      whereClause = `WHERE ${whereClause}`;
    }
    const sql = `SELECT id, name, size, description, value_labels FROM dimension ${whereClause}`;
    const sqlResult = await this.queryDataDelegate?.(
      dataSourceForSqliteLocal,
      sql
    );
    const dimensions = sqlResult?.values?.map(
      (d) =>
        Object.fromEntries(
          d?.map((value, columnIndex) => {
            const columnName = sqlResult?.columns?.[columnIndex];
            if (columnName === "value_labels") {
              value = value ? JSON.parse(value as string) : undefined;
            }
            return [columnName, value as SqlValue | string[]];
          })
        ) as Dimension
    );
    return dimensions;
  }

  private async queryVariables(
    dataSource: string,
    dataSourceForSqliteLocal: string,
    filter?: { ids?: number[]; names?: string[] }
  ) {
    const AVAILABLE_VARIABLES_DICT_KEY =
      "gwf-default.cache.availableVariablesDict";
    let variables =
      this.sharedStates?.[AVAILABLE_VARIABLES_DICT_KEY]?.[
      dataSourceForSqliteLocal
      ];
    if (variables) {
      return variables;
    }

    let availablVariablesDict =
      this.sharedStates?.[AVAILABLE_VARIABLES_DICT_KEY];
    if (!availablVariablesDict) {
      availablVariablesDict = {};
      if (this.sharedStates) {
        this.sharedStates[AVAILABLE_VARIABLES_DICT_KEY] = availablVariablesDict;
      }
    }
    variables = await this.queryVariablesFromDB(dataSourceForSqliteLocal);
    availablVariablesDict[dataSource] = variables;
    let filteredVariables =
      this.sharedStates?.[AVAILABLE_VARIABLES_DICT_KEY]?.[dataSource];
    if (filter?.ids) {
      filteredVariables = filteredVariables?.filter((variable: Variable) =>
        filter.ids?.includes(variable.id)
      );
    }
    if (filter?.names) {
      filteredVariables = filteredVariables?.filter((variable: Variable) =>
        filter.names?.includes(variable.name)
      );
    }
    return filteredVariables;
  }

  private async queryMaxAndMinValue(
    dataSourceForSqliteLocal: string,
    filter?: {
      locations?: number[];
      dimensions?: number[];
      variables?: number[];
    }
  ) {
    if (filter?.dimensions) {
      // TODO not yet implemented
      return undefined;
    }
    let selectClause = `SELECT MAX(value) as max, MIN(value) as min`;
    const locationsConditionClause = filter?.locations
      ? `location IN (${filter.locations.join(", ")})`
      : "";
    const variablesConditionClause = filter?.variables
      ? `variable IN (${filter.variables.join(", ")})`
      : "";
    let whereClause = [locationsConditionClause, variablesConditionClause]
      .filter(Boolean)
      .join(" AND ");
    if (whereClause) {
      whereClause = `WHERE ${whereClause}`;
    }
    const sql = `${selectClause} FROM value ${whereClause}`;
    const sqlResult = await this.queryDataDelegate?.(
      dataSourceForSqliteLocal,
      sql
    );
    const values = sqlResult?.values?.map(
      (d) =>
        Object.fromEntries(
          d?.map((value, columnIndex) => {
            const columnName = sqlResult?.columns?.[columnIndex];
            value = value != null ? JSON.parse(value as string) : undefined;
            return [columnName, value as any];
          })
        ) as { max?: number; min?: number }
    );
    return values?.at(0);
  }

  private async queryValues(
    dataSource: string,
    dataSourceForSqliteLocal: string,
    filter?: {
      location?: number | number[];
      variable?: number | number[];
      dimensionIdAndValueDict?: {
        [dimensionId: number]: number | number[] | undefined;
      };
    }
  ) {
    const selectClause = `SELECT *`;
    const fromClause = `FROM value`;
    let whereClause = "";
    if (filter) {
      let locationConditionClause =
        filter.location != null
          ? `location IN (${this.makeSingleOrArrayAsArray(filter.location).join(
            ", "
          )})`
          : "";
      let variableConditionClause =
        filter.variable != null
          ? `variable IN (${this.makeSingleOrArrayAsArray(filter.variable).join(
            ", "
          )})`
          : "";
      let dimensionConditonClause = filter.dimensionIdAndValueDict
        ? Object.entries(filter.dimensionIdAndValueDict)
          .map(([id, value]) => {
            switch (value) {
              case undefined:
                return "";
              case null:
                return `dimension_${id} IS NULL`;
              default:
                return `dimension_${id} IN (${this.makeSingleOrArrayAsArray(
                  value
                ).join(", ")})`;
            }
          })
          .filter(Boolean)
          .join(" AND ")
        : "";
      whereClause =
        "WHERE " +
        [
          variableConditionClause,
          dimensionConditonClause,
          locationConditionClause,
        ]
          .filter(Boolean)
          .join(" AND ");
    }
    const sql = `${selectClause}\n${fromClause}\n${whereClause}`;
    const sqlResult = await this.queryDataDelegate?.(
      dataSourceForSqliteLocal,
      sql
    );
    const locations = await this.queryLocations(dataSourceForSqliteLocal);
    const variables = await this.queryVariables(
      dataSource,
      dataSourceForSqliteLocal
    );
    const values = sqlResult?.values?.map((d) => {
      const dimensionIdAndValueDict: {
        [dimensionId: number]: number | null;
      } = {};
      const value = Object.fromEntries(
        d
          ?.map((value, columnIndex) => {
            let columnName = sqlResult?.columns?.[columnIndex];
            let modifiedValue: any = value;
            if (columnName === "location") {
              modifiedValue = locations?.find(
                (location) => location.id === value
              );
            }
            if (columnName === "variable") {
              modifiedValue = variables?.find(
                (variable: Variable) => variable.id === value
              );
            }
            if (columnName.startsWith("dimension_")) {
              dimensionIdAndValueDict[+columnName.substring(10)] = value as
                | number
                | null;
              return undefined;
            }
            return [columnName, modifiedValue];
          })
          .filter(Boolean) as [string, any][]
      ) as { locationId: number; variableId: number; value: number };
      return { ...value, dimensionIdAndValueDict };
    });
    return values;
  }

  private async queryVariablesFromDB(dataSource: string) {
    let sql = `SELECT id, name, unit, description FROM variable`;
    let sqlResult = await this.queryDataDelegate?.(dataSource, sql);
    const variables = sqlResult?.values?.map(
      (d) =>
        Object.fromEntries(
          d?.map((value, columnIndex) => [
            sqlResult?.columns?.[columnIndex],
            value,
          ])
        ) as Variable
    );
    const dimensions = await this.queryDimensions(dataSource);
    await this.fillCorrespondingDimensionsIntoVariables(
      dataSource,
      variables,
      dimensions
    );
    return variables;
  }

  private async fillCorrespondingDimensionsIntoVariables(
    dataSourceForSqliteLocal: string,
    variables?: Variable[],
    dimensions?: Dimension[]
  ) {
    const sql = `SELECT variable, dimension FROM variable_dimension`;
    const sqlResult = await this.queryDataDelegate?.(
      dataSourceForSqliteLocal,
      sql
    );
    sqlResult?.values?.forEach(([variableId, dimensionId]) => {
      const variable = variables?.find(
        (variable) => variable.id === variableId
      );
      const dimension = dimensions?.find(
        (dimension) => dimension.id === dimensionId
      );
      if (!variable) {
        return;
      }
      let variableDimensions = (variable as VariableWithDimensions).dimensions;
      if (!variableDimensions) {
        variableDimensions = (variable as VariableWithDimensions).dimensions =
          [];
      }
      dimension && variableDimensions.push(dimension);
    });
  }

  private makeSingleOrArrayAsArray<T>(itemOrItems: T | T[] | undefined) {
    if (Array.isArray(itemOrItems)) {
      return itemOrItems;
    }
    if (itemOrItems == null) {
      return [];
    }
    return [itemOrItems];
  }
}
