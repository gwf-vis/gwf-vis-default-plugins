export type DataSourceNameDict = { [name: string]: string };

export function obtainDataSourceDisplayName(
  dataSource?: string,
  dataSourceDict?: DataSourceNameDict
) {
  if (!dataSource) {
    return;
  }
  return (
    Object.entries(dataSourceDict ?? {}).find(
      ([_, source]) => dataSource === source
    )?.[0] ?? dataSource
  );
}
