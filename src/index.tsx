import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import HealthMap from './component/healthMap';
import {APIProvider} from '@vis.gl/react-google-maps';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API ?? 'No API key'}>
			<HealthMap />
    </APIProvider>
  </React.StrictMode>
);

