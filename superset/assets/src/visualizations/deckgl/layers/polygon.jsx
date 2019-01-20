import React from 'react';
import ReactDOM from 'react-dom';

import { PolygonLayer } from 'deck.gl';

import DeckGLContainer from './../DeckGLContainer';

import * as common from './common';
import sandboxedEval from '../../../modules/sandbox';

function getLayer(formData, payload, slice) {
  const fd = formData;
  const fc = fd.fill_color_picker;

  const sc = fd.stroke_color_picker;
  // let data = [...payload.data.features];
  let data = payload.data.features.map(d => ({
    ...d,
    fillColor: [fc.r, fc.g, fc.b, 255 * fc.a],
  }));
  // const mainMetric = payload.data.metricLabels.length ? payload.data.metricLabels[0] :  null;

  // let colorScaler;
  // if (mainMetric) {
  //   const ext = d3.extent(data, d => d[mainMetric]);
  //   const scaler = colorScalerFactory(fd.linear_color_scheme, null, null, ext, true);
  //   colorScaler = (d) => {
  //     const c = scaler(d[mainMetric]);
  //     c[3] = (fd.opacity / 100.0) * 255;
  //     return c;
  //   };
  // }

  if(fd.extra_filters != undefined) {
    data.extra_filters = fd.extra_filters;
  }



  if (fd.js_data_mutator) {
    // Applying user defined data mutator if defined
    const jsFnMutator = sandboxedEval(fd.js_data_mutator);
    data = jsFnMutator(data);
    console.log(data);
    // delete data.extra_filters;
  }

  return new PolygonLayer({
    id: `path-layer-${fd.slice_id}`,
    data,
    filled: fd.filled,
    stroked: fd.stoked,
    extruded: fd.extruded,
    ...common.commonLayerProps(fd, slice),
  });
}

function deckPolygon(slice, payload, setControlValue) {
  const layer = getLayer(slice.formData, payload, slice);
  const viewport = {
    ...slice.formData.viewport,
    width: slice.width(),
    height: slice.height(),
  };
  ReactDOM.render(
    <DeckGLContainer
      mapboxApiAccessToken={payload.data.mapboxApiKey}
      viewport={viewport}
      layers={[layer]}
      mapStyle={slice.formData.mapbox_style}
      setControlValue={setControlValue}
    />,
    document.getElementById(slice.containerId),
  );
}

module.exports = {
  default: deckPolygon,
  getLayer,
};
