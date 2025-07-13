import {useEffect, useState, useCallback} from 'react';
import {useMap, useMapsLibrary, AdvancedMarker} from '@vis.gl/react-google-maps';
import Combobox from 'react-widgets/Combobox';

import 'react-widgets/styles.css';

interface Props {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
  selectedPlace: google.maps.LatLng | undefined;
  currentLocation: google.maps.LatLngLiteral | google.maps.LatLng;
}

export const AutocompleteSearch = ({onPlaceSelect, selectedPlace, currentLocation}: Props) => {
  	const map = useMap();
  	const places = useMapsLibrary('places');

	const [sessionToken, setSessionToken] = useState<google.maps.places.AutocompleteSessionToken>();
	const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
	const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
	const [predictionResults, setPredictionResults] = useState<Array<google.maps.places.AutocompletePrediction>>([]);

	const [inputValue, setInputValue] = useState<string>('');
	const [clearButtonVisible, setClearButtonVisible] = useState(false);

	const [fetchingData, setFetchingData] = useState<boolean>(false);

	// Update the direction request with the new selected place
	const [directions, updateDirections] = useState<google.maps.LatLng | undefined>()

	const handleClearClick = () => {
		setInputValue('');
		setClearButtonVisible(false);
		onPlaceSelect(null); // Clear the selected place
		map?.panTo(currentLocation); // Pan the map to the current location
		map?.setZoom(16); // Set the zoom level to 16
	  };

	useEffect(() => {
		if (!places || !map) return;

		setAutocompleteService(new places.AutocompleteService());
		setPlacesService(new places.PlacesService(map));
		setSessionToken(new places.AutocompleteSessionToken());

		return () => setAutocompleteService(null);
	}, [map, places]);

	const fetchPredictions = useCallback(
		async (inputValue: string) => {
		if (!autocompleteService || !inputValue) {
			return;
		}

		setFetchingData(true);

		// Location bias for Western Visayas, Philippines
		const latitude = 11.0050; // Latitude of Iloilo City, Philippines
		const longitude = 122.5373; // Longitude of Iloilo City, Philippines
		const location = new google.maps.LatLng(latitude, longitude);
		var radius = 5000; // 5 km radius

		const request = {input: inputValue, location, radius, sessionToken};
		const response = await autocompleteService.getPlacePredictions(request);

		setPredictionResults(response.predictions);
		setFetchingData(false);
		},
		[autocompleteService, sessionToken]
	);

  const onInputChange = useCallback(
    (value: google.maps.places.AutocompletePrediction | string) => {
      if (typeof value === 'string') {
        setInputValue(value);
		setClearButtonVisible(value.length > 0);
        fetchPredictions(value);
      }
    },
    [fetchPredictions]
  );

	const onSelect = useCallback(
		(prediction: google.maps.places.AutocompletePrediction | string) => {
		if (!places || typeof prediction === 'string') return;

		const detailRequestOptions = {
			placeId: prediction.place_id,
			fields: ['geometry', 'name', 'formatted_address'],
			sessionToken
		};

		const detailsRequestCallback = (
			placeDetails: google.maps.places.PlaceResult | null
		) => {
			onPlaceSelect(placeDetails);
			setInputValue(placeDetails?.name ?? '');
			setSessionToken(new places.AutocompleteSessionToken());
			setFetchingData(false);

			// Update the direction request with the new selected place
			updateDirections(placeDetails?.geometry?.location);
		};

		placesService?.getDetails(detailRequestOptions, detailsRequestCallback);
		},
		[onPlaceSelect, places, placesService, sessionToken]
	);

	return (
		<>
			{clearButtonVisible && (
				<button className="clear-button" onClick={handleClearClick}>
				Clear ❌
				</button>
			)}
			<Combobox
			placeholder="Find a health facility..."
			data={predictionResults}
			dataKey="place_id"
			textField="description"
			value={inputValue}
			onChange={onInputChange}
			onSelect={onSelect}
			busy={fetchingData}
			// Since the Autocomplete Service API already returns filtered results
			// always want to display them all.
			filter={() => true}
			focusFirstItem={true}
			hideEmptyPopup
			hideCaret
			/>

			{inputValue && <AdvancedMarker position={selectedPlace} />}
		</>
	);
};
