import {useEffect, useState, useCallback} from 'react';
import {useMap, useMapsLibrary, AdvancedMarker} from '@vis.gl/react-google-maps';
import Combobox from 'react-widgets/Combobox';

import 'react-widgets/styles.css';

interface Props {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
  selectedPlace: google.maps.LatLng | undefined
}

// This uses the Combobox from "react-widgets" (https://jquense.github.io/react-widgets/docs/Combobox)
export const AutocompleteSearch = ({onPlaceSelect, selectedPlace}: Props) => {
  const map = useMap();
  const places = useMapsLibrary('places');

  // https://developers.google.com/maps/documentation/javascript/reference/places-autocomplete-service#AutocompleteSessionToken
  const [sessionToken, setSessionToken] =
    useState<google.maps.places.AutocompleteSessionToken>();

  // https://developers.google.com/maps/documentation/javascript/reference/places-autocomplete-service
  const [autocompleteService, setAutocompleteService] =
    useState<google.maps.places.AutocompleteService | null>(null);

  // https://developers.google.com/maps/documentation/javascript/reference/places-service
  const [placesService, setPlacesService] =
    useState<google.maps.places.PlacesService | null>(null);

  const [predictionResults, setPredictionResults] = useState<
    Array<google.maps.places.AutocompletePrediction>
  >([]);

  const [inputValue, setInputValue] = useState<string>('');

  const [fetchingData, setFetchingData] = useState<boolean>(false);

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
      };

      placesService?.getDetails(detailRequestOptions, detailsRequestCallback);
    },
    [onPlaceSelect, places, placesService, sessionToken]
  );

  return (
	<>
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
