import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

type Gym = {
  id: string;
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
};

type GymWithDistance = Gym & {
  distance?: number;
};

const gyms: Gym[] = [
  {
    id: "1",
    name: "Campus Gym SQY",
    city: "Guyancourt",
    address: "Saint-Quentin-en-Yvelines",
    latitude: 48.77,
    longitude: 2.08,
  },
  {
    id: "2",
    name: "Move Fitness Paris",
    city: "Paris",
    address: "Centre de Paris",
    latitude: 48.86,
    longitude: 2.35,
  },
  {
    id: "3",
    name: "Fitness Boulogne",
    city: "Boulogne-Billancourt",
    address: "Boulogne-Billancourt",
    latitude: 48.8352,
    longitude: 2.2411,
  },
];

function calculateDistance(
  firstLatitude: number,
  firstLongitude: number,
  secondLatitude: number,
  secondLongitude: number
) {
  const radians = Math.PI / 180;

  const longitudeDifference =
    (secondLongitude - firstLongitude) *
    radians *
    Math.cos(
      ((firstLatitude + secondLatitude) *
        radians) /
        2
    );

  const latitudeDifference =
    (secondLatitude - firstLatitude) * radians;

  return (
    6371 *
    Math.hypot(
      longitudeDifference,
      latitudeDifference
    )
  );
}

export default function ChooseGymScreen() {
  const [search, setSearch] = useState("");

  const [position, setPosition] =
    useState<Location.LocationObjectCoords | null>(
      null
    );

  const [selectedGym, setSelectedGym] =
    useState<Gym | null>(null);

  const [loadingPosition, setLoadingPosition] =
    useState(false);

  const [information, setInformation] = useState(
    "Recherchez une salle par ville ou utilisez votre position."
  );

  const useCurrentPosition = async () => {
    try {
      setLoadingPosition(true);

      setInformation(
        "Recherche de votre position..."
      );

      const permission =
        await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setInformation(
          "Position refusée. Vous pouvez toujours rechercher une salle par ville."
        );
        return;
      }

      const currentPosition =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

      setPosition(currentPosition.coords);

      setInformation(
        "Position obtenue. Les salles sont classées par proximité."
      );
    } catch (error) {
      console.error(error);

      setInformation(
        "Impossible d’obtenir votre position. Recherchez une salle manuellement."
      );
    } finally {
      setLoadingPosition(false);
    }
  };

  const displayedGyms = useMemo((): GymWithDistance[] => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    const filteredGyms = gyms.filter(
      (gym) =>
        gym.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        gym.city
          .toLowerCase()
          .includes(normalizedSearch) ||
        gym.address
          .toLowerCase()
          .includes(normalizedSearch)
    );

    if (!position) {
      return filteredGyms;
    }

    return filteredGyms
      .map((gym) => ({
        ...gym,
        distance: calculateDistance(
          position.latitude,
          position.longitude,
          gym.latitude,
          gym.longitude
        ),
      }))
      .sort(
        (firstGym, secondGym) =>
          (firstGym.distance ?? 0) -
          (secondGym.distance ?? 0)
      );
  }, [position, search]);

  const confirmGym = (gym: Gym) => {
    setSelectedGym(gym);

    setInformation(
      `${gym.name} a été sélectionnée.`
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.introduction}>
        <Ionicons
          name="location-outline"
          size={34}
          color="#22C55E"
        />

        <View style={styles.introductionText}>
          <Text style={styles.title}>
            Choisir une salle
          </Text>

          <Text style={styles.subtitle}>
            Recherchez une salle ou utilisez votre
            position.
          </Text>
        </View>
      </View>

      <TextInput
        style={styles.input}
        value={search}
        onChangeText={setSearch}
        placeholder="Ville ou nom de la salle"
        placeholderTextColor="#94A3B8"
        autoCapitalize="words"
      />

      <Pressable
        style={[
          styles.positionButton,
          loadingPosition &&
            styles.disabledButton,
        ]}
        onPress={useCurrentPosition}
        disabled={loadingPosition}
      >
        {loadingPosition ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <Ionicons
              name="navigate-outline"
              size={20}
              color="#FFFFFF"
            />

            <Text style={styles.positionButtonText}>
              Utiliser ma position
            </Text>
          </>
        )}
      </Pressable>

      <View style={styles.informationContainer}>
        <Ionicons
          name="information-circle-outline"
          size={21}
          color="#12355B"
        />

        <Text style={styles.informationText}>
          {information}
        </Text>
      </View>

      {position && (
        <View style={styles.coordinates}>
          <Text style={styles.coordinateText}>
            Latitude :{" "}
            {position.latitude.toFixed(5)}
          </Text>

          <Text style={styles.coordinateText}>
            Longitude :{" "}
            {position.longitude.toFixed(5)}
          </Text>

          <Text style={styles.coordinateText}>
            Précision :{" "}
            {Math.round(position.accuracy ?? 0)} m
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>
        Salles disponibles
      </Text>

      <FlatList
        data={displayedGyms}
        keyExtractor={(gym) => gym.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="search-outline"
              size={42}
              color="#64748B"
            />

            <Text style={styles.emptyText}>
              Aucune salle ne correspond à votre
              recherche.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isSelected =
            selectedGym?.id === item.id;

          return (
            <View
              style={[
                styles.gymCard,
                isSelected &&
                  styles.selectedGymCard,
              ]}
            >
              <View style={styles.gymHeader}>
                <View style={styles.gymIcon}>
                  <Ionicons
                    name="barbell-outline"
                    size={23}
                    color="#22C55E"
                  />
                </View>

                <View style={styles.gymInformation}>
                  <Text style={styles.gymName}>
                    {item.name}
                  </Text>

                  <Text style={styles.gymCity}>
                    {item.city}
                  </Text>
                </View>

                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={27}
                    color="#22C55E"
                  />
                )}
              </View>

              <Text style={styles.gymAddress}>
                {item.address}
              </Text>

              {item.distance !== undefined && (
                <Text style={styles.distance}>
                  {item.distance.toFixed(1)} km à vol
                  d’oiseau
                </Text>
              )}

              <Pressable
                style={[
                  styles.selectButton,
                  isSelected &&
                    styles.selectedButton,
                ]}
                onPress={() => confirmGym(item)}
              >
                <Text style={styles.selectButtonText}>
                  {isSelected
                    ? "Salle sélectionnée"
                    : "Choisir cette salle"}
                </Text>
              </Pressable>
            </View>
          );
        }}
      />

      {Platform.OS === "web" && (
        <Text style={styles.webInformation}>
          Sur le Web, la position dépend des
          autorisations du navigateur.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 18,
    paddingTop: 20,
  },

  introduction: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  introductionText: {
    flex: 1,
    marginLeft: 12,
  },

  title: {
    color: "#12355B",
    fontSize: 27,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#64748B",
    fontSize: 15,
    lineHeight: 21,
    marginTop: 4,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 11,
    paddingHorizontal: 15,
    paddingVertical: 13,
    color: "#1F2937",
    fontSize: 16,
    marginBottom: 12,
  },

  positionButton: {
    minHeight: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#12355B",
    borderRadius: 11,
    gap: 8,
  },

  disabledButton: {
    opacity: 0.6,
  },

  positionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },

  informationContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#DBEAFE",
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },

  informationText: {
    flex: 1,
    color: "#12355B",
    lineHeight: 20,
    marginLeft: 8,
  },

  coordinates: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },

  coordinateText: {
    color: "#475569",
    fontSize: 14,
    marginVertical: 2,
  },

  sectionTitle: {
    color: "#12355B",
    fontSize: 19,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 12,
  },

  list: {
    paddingBottom: 35,
  },

  gymCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 15,
    padding: 16,
    marginBottom: 13,
  },

  selectedGymCard: {
    borderColor: "#22C55E",
  },

  gymHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  gymIcon: {
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    borderRadius: 23,
  },

  gymInformation: {
    flex: 1,
    marginLeft: 12,
  },

  gymName: {
    color: "#12355B",
    fontSize: 17,
    fontWeight: "bold",
  },

  gymCity: {
    color: "#64748B",
    marginTop: 3,
  },

  gymAddress: {
    color: "#475569",
    marginTop: 13,
  },

  distance: {
    color: "#22C55E",
    fontWeight: "600",
    marginTop: 7,
  },

  selectButton: {
    alignItems: "center",
    backgroundColor: "#12355B",
    borderRadius: 9,
    paddingVertical: 11,
    marginTop: 14,
  },

  selectedButton: {
    backgroundColor: "#22C55E",
  },

  selectButtonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },

  emptyText: {
    color: "#64748B",
    textAlign: "center",
    marginTop: 10,
  },

  webInformation: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
    paddingBottom: 8,
  },
});