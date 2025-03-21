import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import DropDownPicker from "react-native-dropdown-picker";
import { Ionicons } from "@expo/vector-icons";
import { uploadToCloudinary } from "../../../lib/cloudinaryUpload"; // Adjust path if needed
import { useAppwrite } from "@/lib/useAppwrite";
import { createBuildingWithDetails, fetchFeatureVector } from "@/lib/appwrite";
const UploadBuilding = () => {
  const [buildingName, setBuildingName] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [featureImages, setFeatureImages] = useState<string[]>([]);
  const [type, setType] = useState("House");
  const [area, setArea] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [facilities, setFacilities] = useState<string[]>([]);
  const [yearBuilt, setYearBuilt] = useState("");
  const [facilitiesOpen, setFacilitiesOpen] = useState(false);
  const facilityOptions = [
    { label: "Parking", value: "parking" },
    { label: "Gym", value: "gym" },
    { label: "Swimming Pool", value: "swimming_pool" },
    { label: "Security", value: "security" },
    { label: "Elevator", value: "elevator" }
  ];
  const [open, setOpen] = useState(false);
  const typeOptions = ["Apartment", "House", "Office", "Villa"];
  const [exteriorImages, setExteriorImages] = useState<string[]>([]);
  const [interiorImages, setInteriorImages] = useState<string[]>([]);
  const pickImage = async (setImageFunction: (images: string[]) => void, currentImages: string[]) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImageFunction([...currentImages, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number, images: string[], setImages: (images: string[]) => void) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
  };

  const renderImagePreviews = (images: string[], setImages: (images: string[]) => void) => (
    <View className="flex-row flex-wrap mt-2">
      {images.map((img, index) => (
        <View key={index} className="relative mr-2 mb-2">
          <Image source={{ uri: img }} className="w-16 h-16 rounded-lg" />
          <TouchableOpacity
            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
            onPress={() => removeImage(index, images, setImages)}
          >
            <Ionicons name="close" size={14} color="white" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
  const { postData, loading, error } = useAppwrite({
    fn: createBuildingWithDetails, // Use createBuilding function
    method: "POST", // Specify this is a POST request
    skip: true, // Skip auto-fetching
  });
  const handleUpload = async () => {
    try {
      console.log("Starting upload process...");
  
      if (!exteriorImages.length || !interiorImages.length) {
        alert("Please select at least one exterior and one interior image.");
        console.warn("Image selection is missing.");
        return;
      }
  
      console.log("Uploading exterior images...");
      const exteriorImage_url = await Promise.all(
        exteriorImages.map(async (image: string) => {
          try {
            const uploaded = await uploadToCloudinary(image);
            console.log(`Exterior Image Uploaded: ${uploaded.url}`);
            return uploaded.url;
          } catch (err) {
            console.error("Failed to upload exterior image:", image, err);
            return null;
          }
        })
      );
  
      console.log("Uploading interior images...");
      const allImages_url = await Promise.all(
        interiorImages.map(async (image: string) => {
          try {
            const uploaded = await uploadToCloudinary(image);
            console.log(`Interior Image Uploaded: ${uploaded.url}`);
            return uploaded.url;
          } catch (err) {
            console.error("Failed to upload interior image:", image, err);
            return null;
          }
        })
      );
  
      if (exteriorImage_url.includes(null) || allImages_url.includes(null)) {
        alert("Some images failed to upload. Please try again.");
        return;
      }
  
      const features_image_url = exteriorImage_url; // Using exterior images for feature extraction
  
      console.log("📌 Sending image URLs for feature extraction...", features_image_url);
      const features_feature_vector = (await fetchFeatureVector(features_image_url)).map(vector =>
        vector.join(",")
      );
  
      console.log("✅ Feature vectors received:", features_feature_vector);
  
      const formData = {
        latitude: Number(latitude),
        longitude: Number(longitude),
        buildingName,
        address,
        country,
        price: Number(price),
        description,
        type, // Now properly sending selected type
        area: Number(area),
        bedrooms: Math.floor(Number(bedrooms)),
        bathrooms: Math.floor(Number(bathrooms)),
        yearBuilt: Math.floor(Number(yearBuilt)),
        exteriorImage_url,
        allImages_url,
        features_image_url,
        features_feature_vector,
        facilities, // Now properly sending selected facilities
      };
  
      console.log("✅ Final Form Data:", JSON.stringify(formData, null, 2));
  
      await createBuildingWithDetails(formData);
  
      console.log("Building successfully uploaded!");
      alert("Building uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed. Try again.");
    }
  };
  
  
  
  
  return (
    <ScrollView
      className="flex-1 bg-white p-4"
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text className="text-2xl font-bold text-center text-blue-600">Upload Building</Text>

      {/* Location Inputs */}
      <Text className="mt-4 text-gray-600">Latitude</Text>
      <TextInput className="border border-gray-300 rounded-lg p-3 mt-2" placeholder="Enter latitude" keyboardType="numeric" value={latitude} onChangeText={setLatitude} />

      <Text className="mt-4 text-gray-600">Longitude</Text>
      <TextInput className="border border-gray-300 rounded-lg p-3 mt-2" placeholder="Enter longitude" keyboardType="numeric" value={longitude} onChangeText={setLongitude} />

      {/* Basic Info */}
      <Text className="mt-4 text-gray-600">Building Name</Text>
      <TextInput className="border border-gray-300 rounded-lg p-3 mt-2" placeholder="Enter building name" value={buildingName} onChangeText={setBuildingName} />

      <Text className="mt-4 text-gray-600">Address</Text>
      <TextInput className="border border-gray-300 rounded-lg p-3 mt-2" placeholder="Enter address" value={address} onChangeText={setAddress} />

      <Text className="mt-4 text-gray-600">Country</Text>
      <TextInput className="border border-gray-300 rounded-lg p-3 mt-2" placeholder="Enter country" value={country} onChangeText={setCountry} />

      <Text className="mt-4 text-gray-600">Price</Text>
      <TextInput className="border border-gray-300 rounded-lg p-3 mt-2" placeholder="Enter price" keyboardType="numeric" value={price} onChangeText={setPrice} />

      <Text className="mt-4 text-gray-600">Description</Text>
      <TextInput className="border border-gray-300 rounded-lg p-3 mt-2" placeholder="Enter description" multiline numberOfLines={4} value={description} onChangeText={setDescription} />

      {/* Image Uploads */}
      <ScrollView className="p-4 bg-white">
        {/* <Text className="text-2xl font-bold text-center text-blue-600">Upload Building</Text> */}
        {/* Exterior Images */}
        <Text className="mt-6 text-gray-700 font-semibold">Exterior Images</Text>
        <TouchableOpacity className="border border-dashed border-blue-400 p-10 items-center mt-2 rounded-lg relative" onPress={() => pickImage(setExteriorImages, exteriorImages)}>
          <Text className="text-blue-500">Tap to select images</Text>
        </TouchableOpacity>
        {renderImagePreviews(exteriorImages, setExteriorImages)}

        {/* Interior Images */}
        <Text className="mt-6 text-gray-700 font-semibold">Interior Images</Text>
        <TouchableOpacity className="border border-dashed border-blue-400 p-10 items-center mt-2 rounded-lg relative" onPress={() => pickImage(setInteriorImages, interiorImages)}>
          <Text className="text-blue-500">Tap to select images</Text>
        </TouchableOpacity>
        {renderImagePreviews(interiorImages, setInteriorImages)}
      </ScrollView>

      {/* Detail Collection */}
      <Text className="mt-6 text-lg font-bold text-gray-700">Building Details</Text>

      <Text className="mt-4 text-gray-600">Type</Text>
      <DropDownPicker
        open={open}
        value={type}
        items={typeOptions.map(option => ({ label: option, value: option }))}
        setOpen={setOpen}
        setValue={setType}
        style={{ marginTop: 10, borderColor: '#ccc' }}
        dropDownContainerStyle={{ borderColor: '#ccc' }}
      />

      <Text className="mt-4 text-gray-600">Area (sq ft)</Text>
      <TextInput className="border border-gray-300 rounded-lg p-3 mt-2" placeholder="Enter area" keyboardType="numeric" value={area} onChangeText={setArea} />

      <Text className="mt-4 text-gray-600">Bedrooms</Text>
      <TextInput className="border border-gray-300 rounded-lg p-3 mt-2" placeholder="Enter number of bedrooms" keyboardType="numeric" value={bedrooms} onChangeText={setBedrooms} />

      <Text className="mt-4 text-gray-600">Bathrooms</Text>
      <TextInput className="border border-gray-300 rounded-lg p-3 mt-2" placeholder="Enter number of bathrooms" keyboardType="numeric" value={bathrooms} onChangeText={setBathrooms} />
      <Text className="mt-4 text-gray-600">Facilities</Text>
      <DropDownPicker
        open={facilitiesOpen}
        value={facilities}
        items={facilityOptions}
        setOpen={setFacilitiesOpen}
        setValue={setFacilities}
        multiple={true} // Enable multi-select
        min={1} // Minimum selection required
        placeholder="Select Facilities"
        style={{ marginTop: 10, borderColor: '#ccc' }}
        dropDownContainerStyle={{ borderColor: '#ccc' }}
        mode="BADGE" // Shows selected items as badges
      />
      <Text className="mt-4 text-gray-600">Year Built</Text>
      <TextInput className="border border-gray-300 rounded-lg p-3 mt-2 w-full" placeholder="Enter year" keyboardType="numeric" value={yearBuilt} onChangeText={setYearBuilt} />

      {/* Upload Button */}
      <TouchableOpacity className="bg-blue-600 p-4 mt-6 rounded-lg items-center" onPress={handleUpload}>
        <Text className="text-white font-bold text-lg">Upload</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default UploadBuilding;
