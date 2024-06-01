import { 
	useMap,
	useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { useState, useEffect } from "react";
  
interface Props {
    currentLocation: google.maps.LatLngLiteral | google.maps.LatLng | google.maps.Place;
    selectedPlace: google.maps.LatLng | undefined;
};
  
export default function Directions({ currentLocation, selectedPlace }: Props) {
  	const map = useMap();
	const routesLibrary = useMapsLibrary("routes")
	const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
	const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();

  //alternative toutes
  	const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);

	const destination = selectedPlace
	? new google.maps.LatLng(selectedPlace)
	: undefined;

	console.log(currentLocation)
  	console.log(destination)

	useEffect(() => {
        if (!routesLibrary || !directionsRenderer) return;
        setDirectionsService(new routesLibrary.DirectionsService());
        setDirectionsRenderer(new routesLibrary.DirectionsRenderer({ map }));
	}, [routesLibrary, map]);

  	useEffect(() => {
        if (!directionsService || !directionsRenderer || !destination) return;

      	directionsService.route({
          	origin: currentLocation,
        	destination: destination,
            travelMode: google.maps.TravelMode.DRIVING,
            provideRouteAlternatives: true
        }).then(response => {
          	directionsRenderer.setDirections(response);
           	setRoutes(response.routes)
      	});
  	}, [directionsService, directionsRenderer])

  	console.log(routes);

  	return null
}