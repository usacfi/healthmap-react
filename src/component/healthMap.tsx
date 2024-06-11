import React from 'react';
import { 
	Map,
	AdvancedMarker,
	CollisionBehavior,
	InfoWindow,
	useMapsLibrary,
	useAdvancedMarkerRef,
	useMap,
} from '@vis.gl/react-google-maps';
import { useState, useMemo, useEffect } from "react";
import {Spinner, Alert, Dropdown, DropdownButton} from 'react-bootstrap';

// files
import '../styles/globals.css';

// components
import { Circle } from './circle';
import { AutocompleteSearch } from './autocompleteSearch';
import MapHandler from './map-handler'
import Directions from './directions';
import { Community, communityData } from '../resources/communityData';

// data
import healthFacilitiesType from '../resources/grouped_data.json'
import DropdownList from 'react-widgets/DropdownList';
const healthFacilities = Object.values(healthFacilitiesType[0]).flat()

export default function HealthMap() {
	// Initializing the map and the current locaiton of the user
    const [currentLocation, setCurrentLocation] = useState<google.maps.LatLngLiteral | google.maps.LatLng>({ lat: 11.0050, lng: 122.5373 });
    const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>();
    const [loadingState, setLoadingState] = useState(true);
	const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | google.maps.LatLng>({ lat: 11.0050, lng: 122.5373 })

	var radiusNum = 700;	// Radius = 700 meter radius
	const [radius, setRadius] = useState(radiusNum);
	const [markers, setMarkers] = useState<{ name: string; healthResourceType: string; address: string; latitude: number; longitude: number}[]>([])

	// this the zoom of the map. If the map did not load it will automatically zoom out to show the whole region
	const zoomLoad = (currentLocation: google.maps.LatLng | google.maps.LatLngLiteral) => currentLocation.lat === 11.0050 && currentLocation.lng === 122.5373 ? 9 : 16;

	// conditionals in changing the color relative to the radius
	const getFillColor = (radius: number) => radius <= radiusNum ? '#3b82f6' : (radius > radiusNum && radius <= 1400) ? '#ffd55c' : '#f44336';
	const getStrokeColor = (radius: number) => radius <= radiusNum ? '#0c4cb3' : (radius > radiusNum && radius <= 1400) ? '#4c3f1b' : '#300d0a';

	const map = useMap()

	const changeCenter = (newCenter: google.maps.LatLng | null) => {
		if (!newCenter) return;
		setMapCenter({ lat: newCenter.lat(), lng: newCenter.lng() });
		setCurrentLocation({lng: newCenter.lng(), lat: newCenter.lat()});
	};

    const getCurrentLocation = () => {
        navigator.geolocation.getCurrentPosition(
        (position) => {
            setMapCenter({ lat: position.coords.latitude, lng: position.coords.longitude});
            setCurrentLocation({ lat: position.coords.latitude, lng: position.coords.longitude})
			setUserLocation ({ lat: position.coords.latitude, lng: position.coords.longitude})
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

	const geometryLibrary = useMapsLibrary("geometry");
	const [geometryLib] = useState<google.maps.GeometryLibrary['spherical'] | null>(null);
	
	// Markers within the access radius
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
		
	useEffect(() => {
		getCurrentLocation()
	}, []);

	// info window
	const [infowindowOpen, setInfowindowOpen] = useState(false);
	const [selectedMarker, setSelectedMarker] = useState<{
		name: string;
		healthResourceType: string;
		address: string;
		latitude: number;
		longitude: number;
	  } | null>(null);
  	const [markerRef, markerAnchor] = useAdvancedMarkerRef();

	const handleMarkerClick = (marker: {name: string, healthResourceType: string, address: string, latitude: number, longitude: number}) => {
		setInfowindowOpen(true);
		setSelectedMarker(marker);
	};
	
	const handleClose = () => {
		setInfowindowOpen(false);
	};

	// autocomplete
	const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);
	const destinationLocation = selectedPlace?.geometry?.location;

	const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);

	const handleCommunitySelect = (community: Community) => {
		setSelectedCommunity(community);
		if (map) {
			map.panTo({ lat: community.latitude, lng: community.longitude });
			map.setZoom(15)
		}
	  };

	useEffect(() => {
		if (selectedCommunity) {
		  	setCurrentLocation({ lat: selectedCommunity.latitude, lng: selectedCommunity.longitude });
		  	setMapCenter({ lat: selectedCommunity.latitude, lng: selectedCommunity.longitude });
		}
	}, [selectedCommunity]);

	const [selectedHealthResourceType, setSelectedHealthResourceType] = useState('All');
	const healthResourceTypes = Object.keys(healthFacilitiesType[0]);

	const handleHealthResourceTypeChange = (event: { target: { value: React.SetStateAction<string>; }; }) => {
		setSelectedHealthResourceType(event.target.value);
	};

	const filteredMarkers = useMemo(() => {
		if (selectedHealthResourceType === 'All') {
		return markers;
		} else {
		return markers.filter((marker) => marker.healthResourceType === selectedHealthResourceType);
		}
	}, [markers, selectedHealthResourceType]);

	const healthResourceTypesOptions = healthResourceTypes.map((type) => ({ name: type }));

	if (loadingState === true) {
		return (
			<div className="center">
					<Spinner animation="border" role="status"> </Spinner>
			</div>
		);
	};

    return (
	<div className="container">
		<div className='controls'>
			<center>
				<h1>Health Map</h1>
			</center>

			<h3>Search Facilities</h3>			
			{map && (
				<AutocompleteSearch onPlaceSelect={setSelectedPlace} selectedPlace={destinationLocation} currentLocation={currentLocation}/>)}
	
			{map && selectedPlace && (
				<Directions currentLocation={currentLocation} selectedPlace={destinationLocation} map={map} />)}

			<h3>Health Facilities Type</h3>
			<select className='dropdown-facilities' value={selectedHealthResourceType} onChange={handleHealthResourceTypeChange}>
				<option value="All">All Health Facilities</option>
				{healthResourceTypes.map((type) => (
					<option key={type} value={type}>
					{type}
					</option>
				))}
			</select>
			
			<div>
				<h3 className='inline-element'>Communities</h3>
				<button className='button-location' onClick={() => {
					if (map) {
					setCurrentLocation(userLocation)
					map.panTo(currentLocation);
					map.setZoom(16);
					}
				}}>
					{/* <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
						<circle cx="12" cy="10" r="3" />
					</svg> */}
					📍
				</button> 
			</div>
			<div className='community-panel'>
				<DropdownList 
					data={communityData} 
					dataKey='name' 
					textField='name' 
					placeholder='Select Community'
					onSelect={(community) => handleCommunitySelect(community)}
				/>
				{/* <div  className='button-stack'>
					{communityData.map((community, index) => (
						<button className='button-communities' key={index} onClick={() => handleCommunitySelect(community)}>
						{community.name}
						</button>
					))}
				</div> */}
			</div>
		</div>
			<div className='map-field'>
			<Map
				mapId={process.env.REACT_APP_GOOGLE_MAPS_ID}
				defaultCenter={mapCenter}
				defaultZoom={zoomLoad(currentLocation)}
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
				>
					<div style={{
						width: 16,
						height: 16,
						position: 'absolute',
						top: 0,
						left: 0,
						background: '#3b82f6',
						border: '2px solid #0c4cb3',
						borderRadius: '50%',
						transform: 'translate(-50%, -50%)'
						}}>	
					</div>
				</AdvancedMarker>

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
				{filteredMarkers.map((marker, index) => (
					<>
						<AdvancedMarker
						key={index}
						ref={markerRef}
						position={{
							lat: marker.latitude,
							lng: marker.longitude,
						}}
						collisionBehavior={CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL}
						onClick={() => handleMarkerClick(marker)}
						title={marker.name}
						/>

						{infowindowOpen && selectedMarker === marker && (
							<InfoWindow
								position={{lat: marker.latitude, lng: marker.longitude}}
								maxWidth={500}
								onCloseClick={handleClose}>
								<h3>{marker.name}</h3>
								<i>{marker.address}</i>
								<p>{marker.healthResourceType}</p>
								<p>Operation Hours: </p>
								<p>Contact Details: </p>
								<p>Services Offered: </p>
							</InfoWindow>
						)} 
					</>
				))}
			</Map>
			<MapHandler place={selectedPlace} />
		</div>
	</div>
    );
  }