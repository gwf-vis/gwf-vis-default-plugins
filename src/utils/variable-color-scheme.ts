export type ColorSchemeDefinition = {
  type: 'predefined' | 'custom';
  scheme: string | string[];
};

export const PREDEFINED_COLOR_SCHEME_DICT: { [name: string]: string[] } = {
  'blue-red': ['blue', 'red'],
};
export const FALLBACK_COLOR_SCHEME = PREDEFINED_COLOR_SCHEME_DICT['blue-red'];

export function obtainVariableColorScheme(variableNameAndColorSchemeDefinitionDict: { [variableName: string]: ColorSchemeDefinition }, variableName: string) {
  const colorSchemeDefinition = variableNameAndColorSchemeDefinitionDict?.[variableName] || variableNameAndColorSchemeDefinitionDict?.[''];
  switch (colorSchemeDefinition?.type) {
    case 'predefined':
      return PREDEFINED_COLOR_SCHEME_DICT[colorSchemeDefinition?.scheme as string];
    case 'custom':
      return colorSchemeDefinition?.scheme as string[];
    default:
      return FALLBACK_COLOR_SCHEME;
  }
}
