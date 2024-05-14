import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import HealthMap from './component/healthMap';
import {APIProvider} from '@vis.gl/react-google-maps';
import config from './config.json';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <APIProvider apiKey={config.GOOGLE_MAPS_API_KEY}>
			<HealthMap />
    </APIProvider>
  </React.StrictMode>
);

