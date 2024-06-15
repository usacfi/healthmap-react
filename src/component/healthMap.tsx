import React from 'react';
import { 
	Map,
	AdvancedMarker,
	CollisionBehavior,
	InfoWindow,
	useMapsLibrary,
	useAdvancedMarkerRef,
	useMap,
	Pin
} from '@vis.gl/react-google-maps';
import { useState, useMemo, useEffect } from "react";
import {Spinner, Alert} from 'react-bootstrap';

// files
import '../styles/globals.css';
import Logo from '../resources/5717514.png'

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

	var radiusNum = 500;	
	const [radius, setRadius] = useState(radiusNum);
	var radiusKM = (radius+200)/1000 // convert to KM
	const [markers, setMarkers] = useState<{ name: string; healthResourceType: string; address: string; latitude: number; longitude: number}[]>([])

	// this the zoom of the map. If the map did not load it will automatically zoom out to show the whole region
	const zoomLoad = (currentLocation: google.maps.LatLng | google.maps.LatLngLiteral) => currentLocation.lat === 11.0050 && currentLocation.lng === 122.5373 ? 9 : 16.5;

	// conditionals in changing the color relative to the radius
	const reachTextChange = (radius: number) => radius <= radiusNum ? 'Walkable' : (radius > radiusNum && radius <= 1800) ? 'Commute' : 'Too Far';
	const getFillColor = (radius: number) => radius <= radiusNum ? '#3b82f6' : (radius > radiusNum && radius <= 1800) ? '#ffd55c' : '#f44336';
	const getStrokeColor = (radius: number) => radius <= radiusNum ? '#0c4cb3' : (radius > radiusNum && radius <= 1800) ? '#4c3f1b' : '#300d0a';

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

	const getMarkerColor = (healthResourceType: string) => {
		switch (healthResourceType) {
			case 'Hospital':
				return '#6f1926'; 
			case 'Medical Laboratory':
				return '#de324c'; // green
			case 'Dialysis Clinic':
				return '#95cf92'; // blue
			case 'Ambulatory Clinic':
				return '#95cf92'; // blue
			case 'Hospital':
				return '#f8e16f'; // red
			case 'Barangay Health Station':
				return '#369acc'; // green
			case 'DOTS Providing Facility':
				return '#9656a2'; // blue
			case 'DOTS Referring Facility':
				return '#9656a2'; // blue
			case 'Municipal Health Office':
				return '#369acc'; // red
			case 'PMDT Facility':
				return '#9656a2'; // green
			case 'Pharmacy':
				return '#f4895f'; // blue
			case 'Private MTBN Facility':
				return '#9656a2'; // blue
			case 'Provincial Health Office':
				return '#369acc'; // green
			case 'Rural Health Unit"':
				return '#369acc'; // blue
			case 'iDOTS Facility':
				return '#9656a2'; // blue
			case 'Birthing Clinic':
				return '#cbabd1'
		  default:
			return '#3b82f6';
		}
	  };

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
			<div className="logo-title">
				<img className='logo' src={Logo} alt='Logo of Health Map'/>
				<h1 className="title">Health Map</h1>
			</div>

			<h3>Search Facilities</h3>			
			{map && (
				<AutocompleteSearch onPlaceSelect={setSelectedPlace} selectedPlace={destinationLocation} currentLocation={currentLocation}/>)}
	
			{map && selectedPlace && (
				<Directions currentLocation={currentLocation} selectedPlace={destinationLocation} map={map} />)}

			{/* <h2>Access Range</h2> */}
			<div className="dist-time" style={{marginTop: 30}}>
				<div className="label">Access Range</div>
				<div className="value">{radiusKM.toFixed(2)} km</div>
			</div>

			<div className="dist-time" style={{marginBottom: 30}}>
				<div className="label">Reachability</div>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<span>{reachTextChange(radius)}</span>
					<div style={{ backgroundColor: getFillColor(radius), width: 20, height: 20, borderRadius: 10, marginLeft: 10 }} />
				</div>
			</div>


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
					📍
				</button> 
			</div>
			<div className='community-panel'>
				<DropdownList 
					data={communityData} 
					dataKey='name' 
					textField='name' 
					placeholder='Select Community'
					filter={false}
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
						>
							<div
								style={{
								width: 12,
								height: 12,
								position: 'absolute',
								top: 0,
								left: 0,
								background: getMarkerColor(marker.healthResourceType),
								border: '1px solid #c3c3c3',
								borderRadius: '50%',
								transform: 'translate(-50%, -50%)',
								}}
							/>
						</AdvancedMarker>

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