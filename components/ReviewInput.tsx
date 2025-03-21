import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import icons from "@/constants/icons";

interface ReviewInputProps {
  onSubmit: (review: { rating: number; comment?: string }) => void;
}

const ReviewInput: React.FC<ReviewInputProps> = ({ onSubmit }) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");

  const handleStarPress = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleSubmit = () => {
    if (rating === 0) {
      alert("Please select a rating before submitting.");
      return;
    }

    onSubmit({ rating, comment });
    setRating(0);
    setComment("");
  };

  return (
    <View className="flex flex-row items-center gap-2 p-4 border border-gray-300 rounded-lg">
      {/* Star Rating */}
      <View className="flex flex-row">
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => handleStarPress(star)}>
            <Image
              source={icons.star}
              className="size-6 mx-1"
              tintColor={star <= rating ? "gold" : "gray"}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Comment Input */}
      <TextInput
        className="flex-1 border border-gray-300 p-2 rounded-md text-black"
        placeholder="Write a comment (optional)..."
        value={comment}
        onChangeText={setComment}
      />

      {/* Submit Button */}
      <TouchableOpacity onPress={handleSubmit} className="p-2 bg-blue-500 rounded-lg">
        <Image source={icons.send} className="size-6" tintColor="white" />
      </TouchableOpacity>
    </View>
  );
};

export default ReviewInput;
