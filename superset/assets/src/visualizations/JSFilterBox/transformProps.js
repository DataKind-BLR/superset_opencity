export default function transformProps(basicChartInput) {
  const {
    datasource,
    filters,
    formData,
    onAddFilter,
    payload,
    rawDatasource,
  } = basicChartInput;
  const {
    groupby,
    instantFiltering,
  } = formData;
  const { verboseMap } = datasource;

  const filtersFields = groupby.map(key => ({
    key,
    label: verboseMap[key] || key,
  }));

  return {
    datasource: rawDatasource,
    filtersFields,
    filtersChoices: payload.data,
    instantFiltering,
    onChange: onAddFilter,
    origSelectedValues: filters || {},
  };
}
