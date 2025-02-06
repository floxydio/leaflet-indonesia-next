"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import { FeatureCollection, Feature } from "geojson";

import "leaflet/dist/leaflet.css";

export default function MapTest() {
    const mapRef = useRef<any>(null);
    const [geoJSONFeatureCollection, setGeoJSONFeatureCollection] = useState<FeatureCollection | null>(null);
    const [filteredData, setFilteredData] = useState<FeatureCollection | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [mapCenter, setMapCenter] = useState([-0.7893, 113.9213]);
    const [zoomLevel, setZoomLevel] = useState(5);
    const [bounds, setBounds] = useState<[[number, number], [number, number]] | null>(null);

    useEffect(() => {
        fetch("/indo.geojson")
            .then((response) => response.json())
            .then((data) => {
                let featureCollection: FeatureCollection = {
                    type: "FeatureCollection",
                    features: data.features.map((f: any) => ({
                        type: "Feature",
                        properties: { ...f.properties },
                        geometry: f.geometry,
                    })),
                };
                setGeoJSONFeatureCollection(featureCollection);
                setFilteredData(featureCollection);
            })
            .catch((error) => console.error("Error loading GeoJSON:", error));
    }, []);

    function calculateBoundingBox(feature: Feature): [[number, number], [number, number]] | null {
        if (!feature.geometry || feature.geometry.type !== "MultiPolygon") return null;

        let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity;

        feature.geometry.coordinates.forEach((polygon) => {
            polygon.forEach((ring) => {
                ring.forEach(([lng, lat]) => {
                    if (lat < minLat) minLat = lat;
                    if (lng < minLng) minLng = lng;
                    if (lat > maxLat) maxLat = lat;
                    if (lng > maxLng) maxLng = lng;
                });
            });
        });

        return [[minLat, minLng], [maxLat, maxLng]];
    }

    useEffect(() => {
        if (!geoJSONFeatureCollection) return;

        if (searchTerm === "") {
            setFilteredData(geoJSONFeatureCollection);
            setMapCenter([-0.7893, 113.9213]);
            setZoomLevel(5);
            setBounds(null);
        } else {
            const filteredFeatures = geoJSONFeatureCollection.features.filter((feature) =>
                feature.properties?.state?.toLowerCase() === searchTerm.toLowerCase()
            );

            if (filteredFeatures.length > 0) {
                const firstFeature = filteredFeatures[0];
                const calculatedBounds = calculateBoundingBox(firstFeature);

                if (calculatedBounds) {
                    setBounds(calculatedBounds);
                }
                setZoomLevel(10);
            }
            setFilteredData({ type: "FeatureCollection", features: filteredFeatures });
        }
    }, [searchTerm, geoJSONFeatureCollection]);

    useEffect(() => {
        if (bounds && mapRef.current) {
            mapRef.current.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.5 });
        }
    }, [bounds]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <input
                type="text"
                placeholder="Search Province..."
                className="p-2 border rounded-md mb-4"
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <MapContainer
                center={mapCenter as [number, number]}
                zoom={zoomLevel}
                ref={mapRef}
                style={{ height: "100vh", width: "100%" }}
            >
                <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {geoJSONFeatureCollection && (
                    <GeoJSON
                        data={geoJSONFeatureCollection}
                        style={(feature) => {
                            const isHighlighted =
                                searchTerm !== "" &&
                                filteredData &&
                                filteredData.features.some((f) => f.properties?.state === feature!.properties?.state);
                            return {
                                color: isHighlighted ? "#FFFF00" : 'transparent',
                                weight: isHighlighted ? 3 : 1,
                                fillOpacity: 0.1,
                            };
                        }}
                    />
                )}

            </MapContainer>
        </div>
    );
}
