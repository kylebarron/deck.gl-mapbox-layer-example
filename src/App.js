import React from "react";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, BitmapLayer } from "@deck.gl/layers";
import { TileLayer } from "@deck.gl/geo-layers";
import { MapboxLayer } from "@deck.gl/mapbox";
import { StaticMap } from "react-map-gl";
import { pushContextState, popContextState } from "@luma.gl/gltools";

// You'll get obscure errors without including the Mapbox GL CSS
import "./mapbox-gl.css";

const mapStyle = require("./style.json");

const initialViewState = {
  longitude: -112.1861,
  latitude: 36.1284,
  zoom: 12.1,
  pitch: 0,
  bearing: 0,
};

export default class Map extends React.Component {
  state = {};

  // DeckGL and mapbox will both draw into this WebGL context
  _onWebGLInitialized = (gl) => {
    this.setState({ gl });
  };

  _onMapLoad = () => {
    const map = this._map;
    const deck = this._deck;

    // This id has to match the id of the Deck layer
    map.addLayer(
      new MapboxLayer({ id: "my-scatterplot", deck }),
      "waterway_other"
    );
    map.addLayer(
      new MapboxLayer({ id: "tile-layer", deck }),
      "waterway_other"
    );
  };

  render() {
    const { gl } = this.state;
    const layers = [
      new ScatterplotLayer({
        id: "my-scatterplot",
        data: [{ position: [-112.152317, 36.0723292], size: 100 }],
        getPosition: (d) => d.position,
        getRadius: (d) => d.size,
        getFillColor: [0, 0, 255],
      }),
      new TileLayer({
        id: 'tile-layer',
        // https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames#Tile_servers
        data: "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",

        pickable: true,
        onHover: this._onHover,
        autoHighlight: true,
        highlightColor: [60, 60, 60, 40],
        // https://wiki.openstreetmap.org/wiki/Zoom_levels
        minZoom: 0,
        maxZoom: 19,

        renderSubLayers: (props) => {
          const {
            bbox: { west, south, east, north },
          } = props.tile;

          return new BitmapLayer(props, {
            data: null,
            image: props.data,
            bounds: [west, south, east, north],
          });
        },
      }),
    ];

    return (
      <DeckGL
        ref={(ref) => {
          // save a reference to the Deck instance
          this._deck = ref && ref.deck;
        }}
        layers={layers}
        initialViewState={initialViewState}
        onBeforeRender={() => pushContextState(gl)}
        onAfterRender={() => popContextState(gl)}
        controller
        onWebGLInitialized={this._onWebGLInitialized}
      >
        {gl && (
          <StaticMap
            ref={(ref) => {
              // save a reference to the mapboxgl.Map instance
              this._map = ref && ref.getMap();
            }}
            gl={gl}
            onLoad={this._onMapLoad}
            mapStyle={mapStyle}
            mapOptions={{ hash: true }}
          />
        )}
      </DeckGL>
    );
  }
}
