import './App.css';

// react
import React, { useState, useEffect } from 'react';

// openlayers
import GeoJSON from 'ol/format/GeoJSON'
import Feature from 'ol/Feature';
import Circle from 'ol/geom/Circle'
// components
import MapWrapper from './components/MapWrapper'

function App() {
  
  // set intial state
  const [ features, setFeatures ] = useState([])

  useEffect( () => {

        const circle=new Feature({
          geometry: new Circle( [2046866.00, 7282891.01],50)
        })
        const circle2=new Feature({
          geometry: new Circle( [2046866.00, 7282891.01],100)
        })

        setFeatures([circle,circle2])


  },[])
  
  return (
    <div className="App">
      
      {/* <div className="app-label">
        <p>React Functional Components with OpenLayers Example</p>
        <p>Click the map to reveal location coordinate via React State</p>
      </div> */}
      
      <MapWrapper features={features} />

    </div>
  )
}

export default App
