import { 
	useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { useState, useEffect } from "react";

  
interface Props {
    currentLocation: google.maps.LatLngLiteral | google.maps.LatLng | google.maps.Place;
    selectedPlace: google.maps.LatLng | undefined;
	map: google.maps.Map | null
}
  
export default function Directions({ currentLocation, selectedPlace, map }: Props) {
	const routesLibrary = useMapsLibrary("routes")
	const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
	const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();

  //alternative toutes
  	const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);
	const [routeIndex, setRouteIndex] = useState(0);
	const selected = routes[routeIndex];
	const leg = selected?.legs[0];

	// Initialize directions service and renderer
	useEffect(() => {
		if (!routesLibrary || !map ) return;
		setDirectionsService(new routesLibrary.DirectionsService());
		setDirectionsRenderer(new routesLibrary.DirectionsRenderer({
			map,
			polylineOptions: {
			  strokeColor: "#ff9a22", 
			  strokeOpacity: 0.8,
			  strokeWeight: 6,
			},
		  }));
	  }, [routesLibrary, map]);
	
	console.log(directionsService)

  	// Use directions service
	useEffect(() => {
		if (!directionsService || !directionsRenderer || !selectedPlace) return;
			directionsService
			.route({
				origin: currentLocation,
				destination: selectedPlace,
				travelMode: google.maps.TravelMode.DRIVING,
				provideRouteAlternatives: true
			})
			.then(response => {
				directionsRenderer.setDirections(response);
				setRoutes(response.routes);
			});
				return () => directionsRenderer.setMap(null);
			}, [directionsService, directionsRenderer]);
	
	// Update direction route
	useEffect(() => {
		if (!directionsRenderer) return;
		directionsRenderer.setRouteIndex(routeIndex);
	  }, [routeIndex, directionsRenderer]);
	
	if (!leg) return null;
	
	return (
	<div className="directions">
		<b>{selected.summary}</b>
		<br/><br/>
		<div className="dist-time">
			<div className="label">Distance</div>
			<div className="value">{leg.distance?.text}</div>
		</div>

		<div className="dist-time">
			<div className="label">Travel Time</div>
			<div className="value">{leg.duration?.text}</div>
		</div>
	
		{routes.length > 1 && (
		<div>
			<h2>Alternative Routes</h2>
			{routes.map((route, index) => (
			<button className="routes-button" onClick={() => setRouteIndex(index)}>
				{route.summary}
			</button>
			))}
		</div>
		)}
	</div>
	);
}