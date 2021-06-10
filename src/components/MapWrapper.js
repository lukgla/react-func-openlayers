// react
import React, { useState, useEffect, useRef } from "react";

// openlayers
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import XYZ from "ol/source/XYZ";
import { transform } from "ol/proj";
import { toStringXY } from "ol/coordinate";
import Overlay from "ol/Overlay.js";
import Geolocation from "ol/Geolocation.js";
import LineString from 'ol/geom/LineString.js';


function MapWrapper(props) {
  // set intial state
  const [map, setMap] = useState();
  const [featuresLayer, setFeaturesLayer] = useState();
  // const [selectedCoord, setSelectedCoord] = useState();

  const mapElement = useRef();
  const mapRef = useRef();
  mapRef.current = map;

  const geolocationMarker = useRef();
  console.log("fuck")
  useEffect(() => {
    const initalFeaturesLayer = new VectorLayer({
      source: new VectorSource(),
    });

    // const PlayerLocationLayer = new VectorLayer({
    //   source: new VectorSource(),
    // });

    const view = new View({
      projection: "EPSG:3857",
      center: [0, 0],
      zoom: 2,
    });

    const initialMap = new Map({
      target: mapElement.current,
      layers: [
        new TileLayer({
          source: new XYZ({
            url: "http://mt0.google.com/vt/lyrs=p&hl=en&x={x}&y={y}&z={z}",
          }),
        }),

        initalFeaturesLayer,
        // PlayerLocationLayer,
      ],
      view: view,
      controls: [],
    });

    // set map onclick handler
    initialMap.on("click", handleMapClick);
    const positions = new LineString([], 'XYZM');
    let deltaMean = 500;
    const marker = new Overlay({
      positioning: "center-center",
      element: geolocationMarker.current,
      stopEvent: false,
    });
    initialMap.addOverlay(marker);
    const geolocation = new Geolocation({
      projection: view.getProjection(),
      trackingOptions: {
        maximumAge: 10000,
        enableHighAccuracy: true,
        timeout: 600000,
      },
    });

    geolocation.on("change", function () {
      const position = geolocation.getPosition();
      const accuracy = geolocation.getAccuracy();
      const heading = geolocation.getHeading() || 0;
      const speed = geolocation.getSpeed() || 0;
      const m = Date.now();
      console.log()
      addPosition(position, heading, m, speed);

      const coords = positions.getCoordinates();
      const len = coords.length;
      if (len >= 2) {
        deltaMean = (coords[len - 1][3] - coords[0][3]) / (len - 1);
      }

      console.log(
        [
          "Position: " + position[0].toFixed(2) + ", " + position[1].toFixed(2),
          "Accuracy: " + accuracy,
          "Heading: " + Math.round(radToDeg(heading)) + "&deg;",
          "Speed: " + (speed * 3.6).toFixed(1) + " km/h",
          "Delta: " + Math.round(deltaMean) + "ms",
        ].join("<br />")
      );
    });

    geolocation.on("error", function () {
      alert("geolocation error");
      // FIXME we should remove the coordinates in positions
    });

    //#region
    // convert radians to degrees
    function radToDeg(rad) {
      return (rad * 360) / (Math.PI * 2);
    }
    // convert degrees to radians
    function degToRad(deg) {
      return (deg * Math.PI * 2) / 360;
    }
    // modulo for negative values
    function mod(n) {
      return ((n % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    }

    function addPosition(position, heading, m, speed) {
      const x = position[0];
      const y = position[1];
      const fCoords = positions.getCoordinates();
      const previous = fCoords[fCoords.length - 1];
      const prevHeading = previous && previous[2];
      if (prevHeading) {
        let headingDiff = heading - mod(prevHeading);

        // force the rotation change to be less than 180°
        if (Math.abs(headingDiff) > Math.PI) {
          const sign = headingDiff >= 0 ? 1 : -1;
          headingDiff = -sign * (2 * Math.PI - Math.abs(headingDiff));
        }
        heading = prevHeading + headingDiff;
      }
      positions.appendCoordinate([x, y, heading, m]);

      // only keep the 20 last coordinates
      positions.setCoordinates(positions.getCoordinates().slice(-20));

      // FIXME use speed instead
      if (heading && speed) {
        geolocationMarker.current.src = "data/geolocation_marker_heading.png";
      } else {
        geolocationMarker.current.src = "data/geolocation_marker.png";
      }
    }

    // recenters the view by putting the given coordinates at 3/4 from the top or
    // the screen
    function getCenterWithHeading(position, rotation, resolution) {
      const size = initialMap.getSize();
      const height = size[1];

      return [
        position[0] - (Math.sin(rotation) * height * resolution * 1) / 4,
        position[1] + (Math.cos(rotation) * height * resolution * 1) / 4,
      ];
    }

    let previousM = 0;
    function updateView() {
      // use sampling period to get a smooth transition
      let m = Date.now() - deltaMean * 1.5;
      m = Math.max(m, previousM);
      previousM = m;
      // interpolate position along positions LineString
      const c = positions.getCoordinateAtM(m, true);
      if (c) {
        view.setCenter(getCenterWithHeading(c, -c[2], view.getResolution()));
        view.setRotation(-c[2]);
        marker.setPosition(c);
        map.render();
      }
    }
     geolocation.setTracking(true); // Start position tracking
    // geolocate device
    // const geolocateBtn = document.getElementById("geolocate");
    // geolocateBtn.addEventListener(
    //   "click",
    //   function () {
    //     // geolocation.setTracking(true); // Start position tracking

    //     tileLayer.on("postrender", updateView);
        initialMap.render();

    //     disableButtons();
    //   },
    //   false
    // );

    // // simulate device move
    // let simulationData;
    // const client = new XMLHttpRequest();
    // client.open("GET", "data/geolocation-orientation.json");

    /**
     * Handle data loading.
     */
    // client.onload = function () {
    //   simulationData = JSON.parse(client.responseText).data;
    // };
    // client.send();

    // const simulateBtn = document.getElementById("simulate");
    // simulateBtn.addEventListener(
    //   "click",
    //   function () {
    //     const coordinates = simulationData;

    //     const first = coordinates.shift();
    //     simulatePositionChange(first);

    //     let prevDate = first.timestamp;
    //     function geolocate() {
    //       const position = coordinates.shift();
    //       if (!position) {
    //         return;
    //       }
    //       const newDate = position.timestamp;
    //       simulatePositionChange(position);
    //       window.setTimeout(function () {
    //         prevDate = newDate;
    //         geolocate();
    //       }, (newDate - prevDate) / 0.5);
    //     }
    //     geolocate();

    //     tileLayer.on("postrender", updateView);
    //     map.render();

    //     disableButtons();
    //   },
    //   false
    // );

    // function simulatePositionChange(position) {
    //   const coords = position.coords;
    //   geolocation.set("accuracy", coords.accuracy);
    //   geolocation.set("heading", degToRad(coords.heading));
    //   const projectedPosition = fromLonLat([coords.longitude, coords.latitude]);
    //   geolocation.set("position", projectedPosition);
    //   geolocation.set("speed", coords.speed);
    //   geolocation.changed();
    // }

    // function disableButtons() {
    //   geolocateBtn.disabled = "disabled";
    //   simulateBtn.disabled = "disabled";
    // }
    //#endregion

    // save map and vector layer references to state
    setMap(initialMap);
    setFeaturesLayer(initalFeaturesLayer);
  }, []);

  useEffect(() => {
    if (props.features.length) {
      // may be null on first render

      // set features to map
      featuresLayer.setSource(
        new VectorSource({
          features: props.features, // make sure features is an array
        })
      );

      // fit map to feature extent (with 100px of padding)
      map.getView().fit(featuresLayer.getSource().getExtent(), {
        padding: [100, 100, 100, 100],
      });
    }
  }, [props.features]);

  // map click handler
  const handleMapClick = (event) => {
    // get clicked coordinate using mapRef to access current React state inside OpenLayers callback
    //  https://stackoverflow.com/a/60643670
    const clickedCoord = mapRef.current.getCoordinateFromPixel(event.pixel);

    // transform coord to EPSG 4326 standard Lat Long
    const transormedCoord = transform(clickedCoord, "EPSG:3857", "EPSG:4326");
    // set React state
    console.log(transormedCoord)
    // setSelectedCoord(transormedCoord);
  };

  // render component
  return (
    <div>
      <div ref={mapElement} className="map-container"></div>
      <img ref={geolocationMarker} id="marker" style={{background: "black",width:"100px",height:"100px" }} ></img>
      <div className="clicked-coord-label">
        {/* <p>{selectedCoord ? toStringXY(selectedCoord, 5) : ""}</p> */}
      </div>
    </div>
  );
}

export default MapWrapper;
