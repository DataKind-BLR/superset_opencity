import React from 'react';
import PropTypes from 'prop-types';
import VirtualizedSelect from 'react-virtualized-select';
import { Creatable } from 'react-select';
import ReactDOM from 'react-dom';
import { Button } from 'react-bootstrap';

import ControlRow from '../../explore/components/ControlRow';
import Control from '../../explore/components/Control';
import controls from '../../explore/controls';
import OnPasteSelect from '../../components/OnPasteSelect';
import VirtualizedRendererWrap from '../../components/VirtualizedRendererWrap';
import { t } from '../../locales';
import './JSFilterBox.css';

// maps control names to their key in extra_filters
const TIME_FILTER_MAP = {
  time_range: '__time_range',
  granularity_sqla: '__time_col',
  time_grain_sqla: '__time_grain',
  druid_time_origin: '__time_origin',
  granularity: '__granularity',
};

const TIME_RANGE = '__time_range';

const propTypes = {
  origSelectedValues: PropTypes.object,
  datasource: PropTypes.object.isRequired,
  instantFiltering: PropTypes.bool,
  filtersFields: PropTypes.arrayOf(PropTypes.shape({
    field: PropTypes.string,
    label: PropTypes.string,
  })),
  filtersChoices: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    text: PropTypes.string,
    filter: PropTypes.string,
    metric: PropTypes.number,
  }))),
  onChange: PropTypes.func,
};
const defaultProps = {
  origSelectedValues: {},
  onChange: () => {},
  instantFiltering: true,
};

class JSFilterBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedValues: props.origSelectedValues,
      hasChanged: false,
    };
    this.changeFilter = this.changeFilter.bind(this);
  }

  getControlData(controlName) {
    const { selectedValues } = this.state;
    const control = Object.assign({}, controls[controlName], {
      name: controlName,
      key: `control-${controlName}`,
      value: selectedValues[TIME_FILTER_MAP[controlName]],
      actions: { setControlValue: this.changeFilter },
    });
    const mapFunc = control.mapStateToProps;
    return mapFunc
      ? Object.assign({}, control, mapFunc(this.props))
      : control;
  }

  clickApply() {
    const { selectedValues } = this.state;
    Object.keys(selectedValues).forEach((fltr, i, arr) => {
      let refresh = false;
      if (i === arr.length - 1) {
        refresh = true;
      }
      this.props.onChange(fltr, selectedValues[fltr], false, refresh);
    });
    this.setState({ hasChanged: false });
  }

  changeFilter(filter, options) {
    const fltr = TIME_FILTER_MAP[filter] || filter;
    let vals = null;
    if (options !== null) {
      if (Array.isArray(options)) {
        vals = options.map(opt => opt.value);
      } else if (options.value) {
        vals = options.value;
      } else {
        vals = options;
      }
    }
    const selectedValues = Object.assign({}, this.state.selectedValues);
    selectedValues[fltr] = vals;
    this.setState({ selectedValues, hasChanged: true });
    if (this.props.instantFiltering) {
      this.props.onChange(fltr, vals, false, true);
    }
  }

  renderDatasourceFilters() {
    const {
      showSqlaTimeGrain,
      showSqlaTimeColumn,
      showDruidTimeGrain,
      showDruidTimeOrigin,
    } = this.props;
    const datasourceFilters = [];
    const sqlaFilters = [];
    const druidFilters = [];
    if (sqlaFilters.length) {
      datasourceFilters.push(
        <ControlRow
          key="sqla-filters"
          className="control-row"
          controls={sqlaFilters.map(control => (
            <Control {...this.getControlData(control)} />
          ))}
        />,
      );
    }
    return datasourceFilters;
  }

  renderFilters() {
    const { filtersFields, filtersChoices } = this.props;
    const { selectedValues } = this.state;

    // Add created options to filtersChoices, even though it doesn't exist,
    // or these options will exist in query sql but invisible to end user.
    Object.keys(selectedValues)
      .filter(key => !selectedValues.hasOwnProperty(key)
        || !(key in filtersChoices))
      .forEach((key) => {
        const choices = filtersChoices[key];
        const choiceIds = new Set(choices.map(f => f.id));
        selectedValues[key]
          .filter(value => !choiceIds.has(value))
          .forEach((value) => {
            choices.unshift({
              filter: key,
              id: value,
              text: value,
              metric: 0,
            });
          });
      });

    // return filtersFields.map(({ key, label }) => {
      const key = "columns";
      console.log(filtersChoices);
      const data = filtersChoices["columns"];
      const max = Math.max(...data.map(d => d.metric));
      return (
        <div key={key} className="m-b-5">
          <span>Select Columns</span>
          <OnPasteSelect
            placeholder={t('Select columns')}
            key={key}
            multi
            value={selectedValues[key]}
            options={data.map((opt) => {
              const perc = Math.round((opt.metric / max) * 100);
              const backgroundImage = (
                'linear-gradient(to right, lightgrey, ' +
                `lightgrey ${perc}%, rgba(0,0,0,0) ${perc}%`
              );
              const style = {
                backgroundImage,
                padding: '2px 5px',
              };
              return { value: opt.id, label: opt.id, style };
            })}
            onChange={(...args) => { this.changeFilter(key, ...args); }}
            selectComponent={Creatable}
            selectWrap={VirtualizedSelect}
            optionRenderer={VirtualizedRendererWrap(opt => opt.label)}
          />
        </div>
      );
    // });
  }

  render() {
    const { instantFiltering } = this.props;

    return (
      <div className="scrollbar-container">
        <div className="scrollbar-content">
          {this.renderDatasourceFilters()}
          {this.renderFilters()}
          {!instantFiltering &&
            <Button
              bsSize="small"
              bsStyle="primary"
              onClick={this.clickApply.bind(this)}
              disabled={!this.state.hasChanged}
            >
              {t('Apply')}
            </Button>
          }
        </div>
      </div>
    );
  }
}

JSFilterBox.propTypes = propTypes;
JSFilterBox.defaultProps = defaultProps;


function jsFilterBox(slice, payload) {
  const d3token = d3.select(slice.selector);
  d3token.selectAll('*').remove();

  // js filter box should ignore the dashboard's filters
  // const url = slice.jsonEndpoint({ extraFilters: false });
  const fd = slice.formData;
  var filtersChoices = {};
  // Making sure the ordering of the fields matches the setting in the
  // dropdown as it may have been shuffled while serialized to json
  console.log(fd);
  //fd.groupby.forEach((f) => {
  //  filtersChoices[f] = payload.data[f];
  //});
  filtersChoices["columns"] = payload.data["columns"]
  console.log(filtersChoices)
  ReactDOM.render(
    <JSFilterBox
      filtersChoices={filtersChoices}
      onChange={slice.addFilter}
      datasource={slice.datasource}
      origSelectedValues={slice.getFilters() || {}}
      instantFiltering={fd.instant_filtering}
    />,
    document.getElementById(slice.containerId),
  );
}

module.exports = jsFilterBox