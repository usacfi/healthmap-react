import React from 'react';
import { 
	Map,
	AdvancedMarker,
	Pin,
	Marker,
	InfoWindow,
	useMapsLibrary,
	useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {Spinner, Alert} from 'react-bootstrap';
// files
import '../styles/globals.css';
import { Circle } from './circle';
import healthFacilities from '../resources/healthMapJSON.json'


export default function HealthMap() {
    const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | google.maps.LatLng>({ lat: 11.0050, lng: 122.5373 });
    const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>();
    const [loadingState, setLoadingState] = useState(true);

	var radiusNum = 700;

	const [radius, setRadius] = React.useState(radiusNum);
	const [markers, setMarkers] = useState<{ name: string; healthResourceType: string; address: string; latitude: number; longitude: number; }[]>([]);

	const zoomLoad = (loadingState: boolean) => loadingState == true? 6 : 16;

	const getFillColor = (radius: number) => radius <= radiusNum ? '#3b82f6' : (radius > radiusNum && radius <= 1400) ? '#ffd55c' : '#f44336';
	const getStrokeColor = (radius: number) => radius <= radiusNum ? '#0c4cb3' : (radius > radiusNum && radius <= 1400) ? '#4c3f1b' : '#300d0a';

	const changeCenter = (newCenter: google.maps.LatLng | null) => {
		if (!newCenter) return;
		setCurrentLocation({lng: newCenter.lng(), lat: newCenter.lat()});
	};

    const getCurrentLocation = () => {
        navigator.geolocation.getCurrentPosition(
        (position) => {
            setMapCenter({ lat: position.coords.latitude, lng: position.coords.longitude});
            setCurrentLocation({ lat: position.coords.latitude, lng: position.coords.longitude})
            setLoadingState(false);
        },
        () => {
		<Alert variant={'warning'} dismissible={true}>
			Geolocation cannot detect location... Setting your current location to Western Visayas
        </Alert>
		setMapCenter({ lat: 11.0050, lng: 122.5373 });
		setLoadingState(false);
        });
      };
		
	useEffect(() => {
		getCurrentLocation()
	}, []);

	const geometryLibrary = useMapsLibrary("geometry");
	const [geometryLib] = useState<google.maps.GeometryLibrary['spherical'] | null>(null);


	const [infowindowOpen, setInfowindowOpen] = useState(true);
  	const [markerRef, markerAnchor] = useAdvancedMarkerRef();

	useEffect(() => {
		if (!geometryLibrary) return;
		const markersWithinRadius = healthFacilities.filter((resource) => {
			const distance = geometryLibrary?.spherical.computeDistanceBetween(
				new google.maps.LatLng(currentLocation),
				new google.maps.LatLng(resource.latitude, resource.longitude)
			  )
			;
		  return distance <= radius;
		});
		setMarkers(markersWithinRadius);
	  }, [geometryLib, currentLocation, radius]);
		

	if (loadingState === true) {
		return (
			<div className="center">
					<Spinner animation="border" role="status"> </Spinner>
			</div>
		);
	};

    return (
	<div className="container">
		<Map
			mapId={"c4c82531f570b1c2"}
			defaultCenter={mapCenter}
			defaultZoom={zoomLoad(loadingState)}
			disableDefaultUI={false}
          	streetViewControl={true}
          	mapTypeControl={false}
			
		>
			<AdvancedMarker
			position={currentLocation}
			draggable={true}
			onDrag={e =>
				setCurrentLocation({lat: e.latLng?.lat() ?? 0, lng: e.latLng?.lng() ?? 0})
			}
        	/>

			<Circle
			radius={radiusNum}
			center={currentLocation}
			onRadiusChanged={setRadius}
			onCenterChanged={changeCenter}
			strokeColor={getStrokeColor(radius)}
			strokeOpacity={1}
			strokeWeight={2}
			fillColor={getFillColor(radius)}
			fillOpacity={0.3}
			editable
			draggable
        	/>
			{markers.map((marker, index) => (
				<>
					<AdvancedMarker
						key={index}
						ref={markerRef}
						position={{
						lat: marker.latitude,
						lng: marker.longitude,
						}}
						onClick={() => setInfowindowOpen(true)}
						title={marker.name}
					/>
					{infowindowOpen && (
						<InfoWindow
							anchor={markerAnchor}
							maxWidth={200}
							onCloseClick={() => setInfowindowOpen(false)}>
							{marker.name}{' '}
							{marker.address}{' '}
							{marker.healthResourceType}
						</InfoWindow>
					)}
				</>
			))}
		</Map>
	</div>
    );
  }