import {
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import MapView, { Marker } from 'react-native-maps';
import icons from "@/constants/icons";
import images from "@/constants/images";
import Comment from "@/components/Comment";
import { facilities } from "@/constants/data";
import { useAppwrite } from "@/lib/useAppwrite";
import { getPropertyById, getPropertyDetailsById, likeProperty, unlikeProperty,isPropertyLiked, createReview } from "@/lib/appwrite";
import { useEffect, useState } from "react";
import ReviewInput from "@/components/ReviewInput";
import { useGlobalContext } from "../../../lib/global-provider";
const Property = () => {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useGlobalContext();
  const windowHeight = Dimensions.get("window").height;

  const { data: property } = useAppwrite({
    fn: getPropertyById,
    params: {
      id: id!,
    },
  });
  
  const [details, setDetails] = useState(null);
  useEffect(() => {
    if (property?.detail?.$id) {
      getPropertyDetailsById({ detailId: property.detail.$id }).then(setDetails);
    }
  }, [property]);
  const [isLiked, setIsLiked] = useState(false);

useEffect(() => {
  const checkLikeStatus = async () => {
    if (user?.$id && property?.$id) {
      const liked = await isPropertyLiked(user.$id, property.$id);
      console.log(isLiked);
      setIsLiked(liked);
    }
  };

  checkLikeStatus();
}, [user?.$id, property?.$id]);
  const handleLikeToggle = async () => {
    try {
      if (isLiked) {
        await unlikeProperty(user?.$id,property?.$id);
      } else {
        await likeProperty(user?.$id,property?.$id);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error("Error toggling like status:", error);
    }
  };
  const handleReviewSubmit = async ({ rating, comment }: { rating: number; comment?: string }) => {
    if (!user) {
      alert("You need to be logged in to submit a review.");
      return;
    }

    const success = await createReview({
      userId: user.$id,
      buildingId: property.$id,
      rating,
      comment,
    });

    if (success) {
      alert("Review submitted successfully!");
    } else {
      alert("Failed to submit review. Please try again.");
    }
  };
  
  return (
    <View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32 bg-white"
      >
        <View className="relative w-full" style={{ height: windowHeight / 2 }}>
          <FlatList
            data={property?.features_image_url}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={{ height: undefined, aspectRatio: 1, marginRight: 10 }}
                resizeMode="cover"
              />
            )}
          />

          <Image
            source={images.whiteGradient}
            className="absolute top-0 w-full z-40"
          />

          <View
            className="z-50 absolute inset-x-7"
            style={{
              top: Platform.OS === "ios" ? 70 : 20,
            }}
          >
            <View className="flex flex-row items-center w-full justify-between">
              <TouchableOpacity
                onPress={() => router.back()}
                className="flex flex-row bg-primary-200 rounded-full size-11 items-center justify-center"
              >
                <Image source={icons.backArrow} className="size-5" />
              </TouchableOpacity>

              <View className="flex flex-row items-center gap-3">
              <TouchableOpacity onPress={handleLikeToggle}>
                <Image
                  source={icons.heart}
                  className="size-7"
                  tintColor={isLiked ? "red" : "#191D31"} 
                />
                </TouchableOpacity>
                <Image source={icons.send} className="size-7" />
              </View>
            </View>
          </View>
        </View>

        <View className="px-5 mt-7 flex gap-2">
          <Text className="text-2xl font-rubik-extrabold">
            {property?.buildingName}
          </Text>

          <View className="flex flex-row items-center gap-3">
            <View className="flex flex-row items-center px-4 py-2 bg-primary-100 rounded-full">
              <Text className="text-xs font-rubik-bold text-primary-300">
                {details?.type}
              </Text>
            </View>

            <View className="flex flex-row items-center gap-2">
              <Image source={icons.star} className="size-5" />
              <Text className="text-black-200 text-sm mt-1 font-rubik-medium">
                {details?.rating} ({property?.price} reviews)
              </Text>
            </View>
          </View>

          <View className="flex flex-row items-center mt-5">
            <View className="flex flex-row items-center justify-center bg-primary-100 rounded-full size-10">
              <Image source={icons.bed} className="size-4" />
            </View>
            <Text className="text-black-300 text-sm font-rubik-medium ml-2">
              {details?.bedrooms} Beds
            </Text>
            <View className="flex flex-row items-center justify-center bg-primary-100 rounded-full size-10 ml-7">
              <Image source={icons.bath} className="size-4" />
            </View>
            <Text className="text-black-300 text-sm font-rubik-medium ml-2">
              {details?.bathrooms} Baths
            </Text>
            <View className="flex flex-row items-center justify-center bg-primary-100 rounded-full size-10 ml-7">
              <Image source={icons.area} className="size-4" />
            </View>
            <Text className="text-black-300 text-sm font-rubik-medium ml-2">
              {details?.area} sqft
            </Text>
          </View>

          {/* <View className="w-full border-t border-primary-200 pt-7 mt-5">
            <Text className="text-black-300 text-xl font-rubik-bold">
              Agent
            </Text>

            <View className="flex flex-row items-center justify-between mt-4">
              <View className="flex flex-row items-center">
                <Image
                  source={{ uri: property?.features_image_url[0] }}
                  className="siz-14 rounded-full"
                />

                <View className="flex flex-col items-start justify-center ml-3">
                  <Text className="text-lg text-black-300 text-start font-rubik-bold">
                    {property?.agent.name}
                    {property?.price}
                  </Text>
                  <Text className="text-sm text-black-200 text-start font-rubik-medium">
                    {property?.agent.email}
                    {property?.price}
                  </Text>
                </View>
              </View>

              <View className="flex flex-row items-center gap-3">
                <Image source={icons.chat} className="size-7" />
                <Image source={icons.phone} className="size-7" />
              </View>
            </View>
          </View> */}

          <View className="mt-7">
            <Text className="text-black-300 text-xl font-rubik-bold">
              Overview
            </Text>
            <Text className="text-black-200 text-base font-rubik mt-2">
              {property?.description}
            </Text>
          </View>
          
          <View className="mt-7">
            <Text className="text-black-300 text-xl font-rubik-bold">
              Facilities
            </Text>

            {details?.facilities.length > 0 && (
            <View className="flex flex-row flex-wrap items-start justify-start mt-2 gap-5">
                {details?.facilities.map((item: string, index: number) => {
                  const facility = facilities.find(
                    (facility) => facility.title === item
                  );

                  return (
                    <View
                      key={index}
                      className="flex flex-1 flex-col items-center min-w-16 max-w-20"
                    >
                      <View className="size-14 bg-primary-100 rounded-full flex items-center justify-center">
                        <Image
                          source={facility ? facility.icon : icons.info}
                          className="size-6"
                        />
                      </View>

                      <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        className="text-black-300 text-sm text-center font-rubik mt-1.5"
                      >
                        {item}
                      </Text>
                    </View>
                  );
                })}
              </View> 
            )}
          </View>

          <View className="mt-7">
            <View className="mt-4">
              <Text className="text-black-300 text-xl font-rubik-bold">Location</Text>

              <View className="flex flex-row items-center justify-start mt-4 gap-2">
                <Image source={icons.location} className="w-7 h-7" />
                <Text className="text-black-200 text-sm font-rubik-medium">
                  {property?.address}
                </Text>
              </View>

              {/* Small Map */}
              <MapView
                style={{ width: "100%", height: 200, borderRadius: 10, marginTop: 10 }}
                initialRegion={{
                  latitude: property?.latitude || 37.7749, // Default to San Francisco
                  longitude: property?.longitude || -122.4194,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                  latitude: property?.latitude || 37.7749, // Default to San Francisco
                  longitude: property?.longitude || -122.4194
                  }}
                  title="Property Location"
                />
              </MapView>
            </View>

            {/* <Image
              source={images.map}
              className="h-52 w-full mt-5 rounded-xl"
            /> */}
          </View>

          {/* {property?.reviews.length > 0 && ( */}
          <View className="mt-7">
            <View className="flex flex-row items-center justify-between">
              <View className="flex flex-row items-center">
                <Image source={icons.star} className="size-6" />
                <Text className="text-black-300 text-xl font-rubik-bold ml-2">
                    {details?.rating} 
                    {/* /*({property?.reviews.length} reviews) */}
                  </Text>
              </View>
            </View>

            <View className="mt-5">
              <ReviewInput onSubmit={handleReviewSubmit} />
              </View>
          </View>
          {/* )} */}
        </View>
      </ScrollView>

      <View className="absolute bg-white bottom-0 w-full rounded-t-2xl border-t border-r border-l border-primary-200 p-7">
        <View className="flex flex-row items-center justify-between gap-10">
          <View className="flex flex-col items-start">
            <Text className="text-black-200 text-xs font-rubik-medium">
              Price
            </Text>
            <Text
              numberOfLines={1}
              className="text-primary-300 text-start text-2xl font-rubik-bold"
            >
              ${property?.price}
            </Text>
          </View>

          <TouchableOpacity className="flex-1 flex flex-row items-center justify-center bg-primary-300 py-3 rounded-full shadow-md shadow-zinc-400">
            <Text className="text-white text-lg text-center font-rubik-bold">
              Book Now
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Property;