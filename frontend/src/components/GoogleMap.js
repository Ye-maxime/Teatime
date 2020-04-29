import React, { useState, useEffect } from 'react';
import { Map, GoogleApiWrapper, Marker } from 'google-maps-react';
import { clickIcon, defaultIcon } from '../assets/bundle';
import { googleMapApiKey } from '../config/config';

const StoreMap = ({ stores, storeSelected, showStore, google }) => {
    const [zoomValue, setZoomValue] = useState(12);
    const [center, setCenter] = useState({ lat: 48.88, lng: 2.33 });

    const onMarkerClick = (position) => {
        showStore(position);
        setZoomValue(15);
        setCenter(position);
    };

    useEffect(() => {
        if (storeSelected !== 0) {
            setCenter(getPositionFromId(storeSelected));
            setZoomValue(15);
        }
    }, [storeSelected]);

    const getPositionFromId = (id) => {
        const storeFind = stores.find((store) => {
            return store.id === id;
        });

        return { lat: storeFind.latitude, lng: storeFind.longitude };
    };

    const displayMarkers = () => {
        return stores.map((store, index) => {
            return <Marker
                key={index}
                id={index}
                position={{ lat: store.latitude, lng: store.longitude }}
                onClick={() => onMarkerClick({ lat: store.latitude, lng: store.longitude })}
                icon={storeSelected === store.id ? clickIcon : defaultIcon} />
        });
    };

    return (
        <Map
            google={google}
            zoom={zoomValue}
            className='mapStyles'
            initialCenter={center}
            center={center}>
            {displayMarkers()}
        </Map>
    );
}

export default GoogleApiWrapper({
    apiKey: googleMapApiKey
})(StoreMap);