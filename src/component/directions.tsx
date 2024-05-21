import React from 'react';
import { 
	useMap,
	AdvancedMarker,
	Pin,
	Marker,
	InfoWindow,
	useMapsLibrary,
	useAdvancedMarkerRef,
    
} from '@vis.gl/react-google-maps';
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
  
type Props = {
    currentLocation: google.maps.LatLngLiteral | google.maps.LatLng | google.maps.Place;
    selectedPlace: google.maps.LatLng | undefined;
};
  
export default function Directions({ currentLocation, selectedPlace }: Props) {
    const map = useMap();
	const routesLibrary = useMapsLibrary("routes")
	const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
	const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();

    //alternative toutes
    const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>();

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

    const polylineRef = useRef<google.maps.Polyline>();

    useEffect(() => {
    if (!routes || !routes.length || !polylineRef.current) return;

    const path = new google.maps.MVCArray();
    const route = routes[0];
    const legs = route.legs;

    for (let i = 0; i < legs.length; i++) {
      const steps = legs[i].steps;

      for (let j = 0; j < steps.length; j++) {
        const nextSegment = steps[j].path;

        for (let k = 0; k < nextSegment.length; k++) {
          const latlng = nextSegment[k];
          path.push(latlng);
        }
      }
    }

    if (!polylineRef.current) {
      polylineRef.current = new google.maps.Polyline({
        map: map,
        path: path,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 2
      });
    } else {
      polylineRef.current.setPath(path);
    }
    }, [routes, map]);

    console.log(routes);

    return null
  }