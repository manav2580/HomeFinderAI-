// import React, { useState } from "react";
// import { View, TouchableOpacity, Image, TextInput } from "react-native";
// import { useDebouncedCallback } from "use-debounce";

// import icons from "@/constants/icons";
// import { useLocalSearchParams, router, usePathname } from "expo-router";

// const Search = () => {
//   const path = usePathname();
//   const params = useLocalSearchParams<{ query?: string }>();
//   const [search, setSearch] = useState(params.query);

//   const debouncedSearch = useDebouncedCallback((text: string) => {
//     router.setParams({ query: text });
//   }, 500);

//   const handleSearch = (text: string) => {
//     setSearch(text);
//     debouncedSearch(text);
//   };

//   return (
//     <View className="flex flex-row items-center justify-between w-full px-4 rounded-lg bg-accent-100 border border-primary-100 mt-5 py-2">
//       <View className="flex-1 flex flex-row items-center justify-start z-50">
//         <Image source={icons.search} className="size-5" />
//         <TextInput
//           value={search}
//           onChangeText={handleSearch}
//           placeholder="Search for anything"
//           className="text-sm font-rubik text-black-300 ml-2 flex-1"
//         />
//       </View>
//       <TouchableOpacity>
//         <Image source={icons.camera} className="size-5 mr-3" />
//       </TouchableOpacity>
//       <TouchableOpacity>
//         <Image source={icons.filter} className="size-5" />
//       </TouchableOpacity>
//     </View>
//   );
// };

// export default Search;


import React, { useState } from "react";
import { View, TouchableOpacity, Image, TextInput, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useDebouncedCallback } from "use-debounce";
import { useLocalSearchParams, router } from "expo-router";
import icons from "@/constants/icons";
import axios from "axios";

const Search = () => {
  const params = useLocalSearchParams<{ query?: string }>();
  const [search, setSearch] = useState(params.query);
  const [uploading, setUploading] = useState(false);

  const debouncedSearch = useDebouncedCallback((text: string) => {
    router.setParams({ query: text });
  }, 500);

  const handleSearch = (text: string) => {
    setSearch(text);
    debouncedSearch(text);
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Allow access to gallery to upload images.");
      return;
    }
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    
    if (!result.canceled) {
      recognizeBuilding(result.assets[0].uri);
    }
  };

  const API_BASE_URL = "http://192.168.0.212:8000/predict/"; // Replace with your PC’s IP

  const recognizeBuilding = async (imageUri: string) => {
    try {
      setUploading(true);
      console.log("Image URI:", imageUri);
  
      let formData = new FormData();
      formData.append("file", {
        uri: imageUri,
        name: "building.jpg",
        type: "image/jpeg",
      } as any); // <-- Ensures correct TypeScript handling
  
      console.log("FormData:", formData);
  
      const response = await axios.post(API_BASE_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      // console.log("Server Response:", response.data);
  
      if (response.data) {
      router.push(`/properties/${response.data.predicted_id}`)
      } else {
        Alert.alert("No Match Found", "Could not recognize the building.");
      }
    } catch (error: any) {
      console.error("Recognition Error:", error.response?.data || error.message);
      Alert.alert("Error", `Failed to recognize the building.\n${error.response?.data?.detail || error.message}`);
    } finally {
      setUploading(false);
    }
  };
  


  return (
    <View className="flex flex-row items-center justify-between w-full px-4 rounded-lg bg-accent-100 border border-primary-100 mt-5 py-2">
      <View className="flex-1 flex flex-row items-center justify-start z-50">
        <Image source={icons.search} className="size-5" />
        <TextInput
          value={search}
          onChangeText={handleSearch}
          placeholder="Search for anything"
          className="text-sm font-rubik text-black-300 ml-2 flex-1"
        />
      </View>
      <TouchableOpacity onPress={pickImage} disabled={uploading}>
        <Image source={icons.camera} className="size-5 mr-3" />
      </TouchableOpacity>
      <TouchableOpacity>
        <Image source={icons.filter} className="size-5" />
      </TouchableOpacity>
    </View>
  );
};

export default Search;
