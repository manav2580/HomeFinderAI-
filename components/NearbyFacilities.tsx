import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import axios from "axios";
import { Card, Title, ActivityIndicator } from "react-native-paper";

const PLACE_TYPES = ["hospital", "school", "train_station"];

const NearbyFacilities = ({ latitude, longitude }) => {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        const results = [];
        for (const type of PLACE_TYPES) {
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/search`,
            {
              params: {
                q: type,
                format: "json",
                lat: latitude,
                lon: longitude,
                radius: 5000,
                limit: 10,
              },
            }
          );
          results.push(
            ...response.data.map((place) => ({
              id: place.place_id,
              name: place.display_name.split(",")[0],
              address: place.display_name,
              location: {
                lat: parseFloat(place.lat),
                lng: parseFloat(place.lon),
              },
              type,
            }))
          );
        }
        setFacilities(results);
      } catch (error) {
        console.error("Error fetching places:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaces();
  }, [latitude, longitude]);

  if (loading) return <ActivityIndicator animating size="large" />;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {facilities.map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.location.lat,
              longitude: place.location.lng,
            }}
            title={place.name}
            description={place.address}
          />
        ))}
      </MapView>
      
      <FlatList
        data={facilities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Title>{item.name}</Title>
              <Text>{item.address}</Text>
              <Text style={styles.type}>{item.type.replace("_", " ").toUpperCase()}</Text>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: "#f5f5f5" },
  map: { height: 250, marginBottom: 10, borderRadius: 10 },
  card: { marginBottom: 10, padding: 10, backgroundColor: "white", borderRadius: 10, elevation: 4 },
  type: { marginTop: 5, fontSize: 12, color: "gray" },
});

export default NearbyFacilities;
