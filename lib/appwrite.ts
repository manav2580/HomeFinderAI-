import { Account, Avatars, Client, Databases, ID, OAuthProvider, Query } from "react-native-appwrite"
import * as Linking from 'expo-linking'
import { openAuthSessionAsync } from "expo-web-browser";

import { Float } from "react-native/Libraries/Types/CodegenTypes";
export const config={
    platform:'com.jsm.restate',
    endpoint:process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
    projectId:process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
    databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
    galleriesCollectionId:process.env.EXPO_PUBLIC_APPWRITE_GALLERIES_COLLECTION_ID,
    reviewsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID,
    agentsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_AGENTS_COLLECTION_ID,
    propertiesCollectionId:process.env.EXPO_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID,
    detailsCollectionId:process.env.EXPO_PUBLIC_APPWRITE_DETAILS_COLLECTION_ID,
    buildingsCollectionId:process.env.EXPO_PUBLIC_APPWRITE_BUILDINGS_COLLECTION_ID,
    usersCollectionId:process.env.EXPO_PUBLIC_APPWRITE_USERS_COLLECTION_ID,
    bucketId: process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID,
}
export const client=new Client();
client.setEndpoint(config.endpoint!).setProject(config.projectId!).setPlatform(config.platform!)

export const avatar=new Avatars(client);
export const account=new Account(client);
export  const databases=new Databases(client);
interface ReviewData {
  userId: string;  // Now using documentId instead of userId object
  buildingId: string;
  rating: number;
  comment?: string;
}
async function getUserDocument(userId: string) {
  try {
    console.log(`[getUserDocument] Fetching user document for documentId: ${userId}`);
    
    const userDocument = await databases.getDocument(
      config.databaseId!,
      config.usersCollectionId!,
      userId
    );

    console.log(`[getUserDocument] User document found:`, userDocument);
    return userDocument;
  } catch (error) {
    console.error(`[getUserDocument] Error fetching user document:`, error);
    return null;
  }
}
// ✅ Like a property (Add to user's `likes` array)
export async function likeProperty(userId:string, buildingId:string) {
  try {
    console.log(`[likeProperty] Attempting to like property ${buildingId} for user ${userId}`);
    
    const user = await getUserDocument(userId);
    if (!user) throw new Error(`User not found for userId: ${userId}`);
    
    const updatedLikes = user.likes ? [...user.likes, buildingId] : [buildingId];
    
    console.log(`[likeProperty] Updated likes array:`, updatedLikes);
    
    await databases.updateDocument(
      config.databaseId!,
      config.usersCollectionId!,
      user.$id,
      { likes: updatedLikes }
    );
    
    console.log(`[likeProperty] Property ${buildingId} successfully liked`);
    return true;
  } catch (error) {
    console.error(`[likeProperty] Error liking property:`, error);
    return false;
  }
}

export async function unlikeProperty(userId: string, buildingId: string) {
  try {
    console.log(`[unlikeProperty] Attempting to unlike property ${buildingId} for user ${userId}`);
    
    const user = await getUserDocument(userId);
    if (!user) throw new Error(`User not found for userId: ${userId}`);
    
    // Ensure likes is an array of document IDs
    const updatedLikes = user.likes?.map((like: any) => like.$id).filter((id: string) => id !== buildingId) || [];
    
    console.log(`[unlikeProperty] Updated likes list:`, updatedLikes);
    
    await databases.updateDocument(
      config.databaseId!,
      config.usersCollectionId!,
      user.$id,
      {
        likes: updatedLikes, // Updating with remaining relation IDs
      }
    );
    
    console.log(`[unlikeProperty] Property ${buildingId} successfully unliked`);
    return true;
  } catch (error) {
    console.error(`[unlikeProperty] Error unliking property:`, error);
    return false;
  }
}

export async function isPropertyLiked(userId: string, buildingId: string) {
  try {
    const user = await getUserDocument(userId);
    return user?.likes?.some((like: any) => like.$id === buildingId) || false;
  } catch (error) {
    console.error("Error checking like status:", error);
    return false;
  }
}

export async function login(){
  try{
    const redirectUri=Linking.createURL('/');
    const response=await account.createOAuth2Token(OAuthProvider.Google,redirectUri);
        if(!response)
          throw new Error("Failed to login")
        const browserResult=await openAuthSessionAsync(
          response.toString(),
          redirectUri
        )
        if(browserResult.type!=='success')
        {
            throw new Error("Failed to login")
          }
          const url=new URL(browserResult.url);
          const secret=url.searchParams.get('secret')?.toString();
          const userId=url.searchParams.get('userId')?.toString();
          
          if(!secret||!userId)
            {
              throw new Error("Failed to find user");
            }
         // ✅ First, create a session so the user is authenticated
         const session = await account.createSession(userId, secret);
         if (!session) throw new Error("Failed to create session");
         
         // ✅ Now, get the authenticated user details
         const user = await account.get();
 
         // ✅ Then, create user in the database (user is now authenticated)
         await createUserIfNotExists(user);
         
         return true;
        }
        catch(error)
        {
        console.error(error);
        return false;
      }
    }
export async function createUserIfNotExists(userId: string) {
      try {
        console.log("🔍 [Debug] Function called with userId:", userId);
    
        // Step 1: Fetch authenticated user details
        const user = await account.get();
        if (!user) throw new Error("❌ [Error] User not authenticated");
    
        console.log("✅ [Debug] Authenticated user:", JSON.stringify(user, null, 2));
    
        // Step 2: Generate profile picture
        const profilePic = avatar.getInitials(user.name).toString();
    
        // Step 3: Check if user already exists in the database
        const existingUser = await databases.listDocuments(
          config.databaseId!,
          config.usersCollectionId!,
          [Query.equal("$id", [user.$id])] // Query using document ID
        );
    
        console.log("📄 [Debug] Existing user count:", existingUser.documents.length);
    
        if (existingUser.documents.length === 0) {
          // Step 4: Create a new user document
          console.log("📝 [Debug] Creating new user document...");
          
          const createdUser = await databases.createDocument(
            config.databaseId!,
            config.usersCollectionId!,
            user.$id, // Use user.$id as documentId
            {
              name: user.name,
              email: user.email,
              role: "user",
              profilePic: profilePic || "",
            }
          );
    
          console.log("✅ [Debug] User created successfully:", JSON.stringify(createdUser, null, 2));
        } else {
          console.log("⚠️ [Debug] User already exists in the database. No action needed.");
        }
      } catch (error) {
        console.error("❌ [Error] Creating user failed:", JSON.stringify(error, null, 2));
      }
    }
    
export async function logout() {
    try {
      const result = await account.deleteSession("current");
      return result;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
  export async function getCurrentUser() {
    try {
      const result = await account.get();
      if (result.$id) {
        const userAvatar = avatar.getInitials(result.name);
        
        return {
          ...result,
          avatar: userAvatar.toString(),
        };
      }
      
      return null;
    } catch (error) {
      console.log(error);
      return null;
    }
  }
export async function getLatestProperties() {
  try {
    const result = await databases.listDocuments(
      config.databaseId!,
      // config.propertiesCollectionId!,
      config.buildingsCollectionId!,
      [Query.orderDesc("$createdAt"), Query.limit(5)]
    );
    
    return result.documents;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function getProperties({
  filter,
  query,
  limit,
}: {
  filter: string;
  query: string;
  limit?: number;
}) {
  try {
    const buildQuery = [Query.orderDesc("$createdAt")];
    
    if (filter && filter !== "All") {
      // Step 1: Fetch all details matching the filter
      let allDetailDocs: any[] = [];
      let offset = 0;
      let hasMore = true;
      
      while (hasMore) {
        const detailsResult = await databases.listDocuments(
          config.databaseId!,
          config.detailsCollectionId!,
          [Query.equal("type", filter), Query.limit(100), Query.offset(offset)]
        );
        
        allDetailDocs = allDetailDocs.concat(detailsResult.documents);
        hasMore = detailsResult.documents.length === 100;
        offset += 100;
      }
      
      const detailIds = allDetailDocs.map((detail) => detail.$id);
      
      if (detailIds.length > 0) {
        // Step 2: Fetch buildings in separate queries (since Appwrite limits to 100 items)
        let allBuildingDocs: any[] = [];
        
        for (let i = 0; i < detailIds.length; i += 100) {
          const chunk = detailIds.slice(i, i + 100);
          const buildingsResult = await databases.listDocuments(
            config.databaseId!,
            config.buildingsCollectionId!,
            [Query.equal("detail", chunk)]
          );
          
          allBuildingDocs = allBuildingDocs.concat(buildingsResult.documents);
        }
        
        return allBuildingDocs; // Return merged results
      } else {
        return []; // No matching buildings
      }
    }

    if (query) {
      buildQuery.push(
        Query.or([
          Query.search("buildingName", query),
          Query.search("address", query),
        ])
      );
    }
    
    if (limit) buildQuery.push(Query.limit(limit));
    
    // Step 3: Fetch buildings normally (if no filter applied)
    const result = await databases.listDocuments(
      config.databaseId!,
      config.buildingsCollectionId!,
      buildQuery
    );
    
    return result.documents;
  } catch (error) {
    console.error(error);
    return [];
  }
}
// write function to get property by id
export async function getPropertyById({ id }: { id: string }) {
  try {
    const result = await databases.getDocument(
      config.databaseId!,
      // config.propertiesCollectionId!,
      config.buildingsCollectionId!,
      id
    );
    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
}
export const getPropertyDetailsById = async ({ detailId }: { detailId: string }) => {
  if (!detailId) {
    // console.log("❌ No detailId provided!");
    return null; // Handle edge case
  }
  
  // console.log("🟢 Fetching details for ID:", detailId);
  
  try {
    const databases = new Databases(client);
    const response = await databases.getDocument(
      config.databaseId!,
      config.detailsCollectionId!,
      detailId
    );
    
    // console.log("✅ Details fetched:", response);
    return response;
  } catch (error) {
    // console.error("❌ Error fetching details:", error);
    return null;
  }
};
export async function fetchFeatureVector(images: string[]): Promise<string[]> {
  try {
    console.log("📌 Sending image URLs for feature extraction...");

    const formData = new FormData();
    images.forEach((url) => formData.append("urls", url)); // Append each URL to form data
    // console.log("FormData:",formData)
    const response = await fetch("http://192.168.0.6:8000/extract_features_from_urls/", {
      method: "POST",
      body: formData,
    });
    // console.log(response);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    // console.log("✅ Feature vectors received:", data.features);
    
    return data.features || []; // Ensure we return an array of feature vectors
  } catch (error) {
    console.error("❌ Error fetching feature vector:", error);
    return [];
  }
}
export async function createBuildingWithDetails({
  latitude,
  longitude,
  buildingName,
  address,
  country,
  price,
  description,
  type,
  area,
  bedrooms,
  bathrooms,
  yearBuilt,
  exteriorImage_url,
  allImages_url,
  features_image_url,
  features_feature_vector,
  facilities, // ✅ Added facilities parameter
}: {
  latitude: number;
  longitude: number;
  buildingName: string;
  address: string;
  country: string;
  price: number;
  description: string;
  type: string; // ✅ Changed from "House" to string (for dynamic selection)
  area: number;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  exteriorImage_url: string[];
  allImages_url: string[];
  features_image_url: string[];
  features_feature_vector: string[];
  facilities: string[]; // ✅ Facilities added
}) {
  // console.log("✅ createBuildingWithDetails function started!");
  try {
    // Creating Building Document
    const buildingFormData = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      buildingName,
      address,
      country,
      price: Number(price),
      description,
      exteriorImage_url,
      allImages_url,
      features_image_url,
      features_feature_vector, // External API Data
    };
    
    // console.log("✅ Building Form Data:", JSON.stringify(buildingFormData, null, 2));
    
    const buildingResult = await databases.createDocument(
      config.databaseId!,
      config.buildingsCollectionId!,
      ID.unique(),
      buildingFormData
    );
    
    // console.log("✅ Building successfully created!");
    
    // Creating Details Document
    const detailsFormData = {
      buildingName,
      type, // ✅ Now dynamically passed
      area: Number(area),
      bedrooms: Math.floor(Number(bedrooms)),
      bathrooms: Math.floor(Number(bathrooms)),
      rating: 0, // Default rating
      facilities, // ✅ Now properly included
      yearBuilt: Math.floor(Number(yearBuilt)),
    };
    
    // console.log("✅ Details Form Data:", JSON.stringify(detailsFormData, null, 2));
    
    const detailsResult = await databases.createDocument(
      config.databaseId!,
      config.detailsCollectionId!, // Ensure you have this collection ID in your config
      ID.unique(),
      detailsFormData
    );
    
    // console.log("✅ Details successfully created!");
    
    return { building: buildingResult, details: detailsResult };
  } catch (error) {
    console.error("❌ Error creating building and details:", error);
    return null;
  }
}
export const createReview = async ({
  userId,
  buildingId,
  rating,
  comment = "",
}: ReviewData): Promise<boolean> => {
  try {
    console.log("🔍 [Debug] Function called with:");
    console.log("  userId (documentId):", userId);
    console.log("  buildingId:", buildingId);
    console.log("  rating:", rating);
    console.log("  comment:", comment);

    if (!userId || !buildingId || !rating) {
      console.error("❌ [Error] Missing required parameters.");
      return false;
    }
    console.log("✅ [Debug] Required parameters exist.");

    // 🛠 Step 1: Create Review Document
    console.log("🛠 [Debug] Creating review document...");
    const reviewData = { rating, comment, createdAt: new Date().toISOString() };

    const createdReview = await databases.createDocument(
      config.databaseId!,
      config.reviewsCollectionId!,
      ID.unique(),
      reviewData
    );

    console.log("✅ [Debug] Review created successfully!", createdReview.$id);

    // 🔗 Step 2: Link the review to User & Building
    console.log("🔗 [Debug] Fetching existing User & Building reviews...");

    const userDoc = await databases.getDocument(
      config.databaseId!,
      config.usersCollectionId!,
      userId
    );

    const buildingDoc = await databases.getDocument(
      config.databaseId!,
      config.buildingsCollectionId!,
      buildingId
    );

    const updatedUserReviews = [...(userDoc.reviews || []), createdReview.$id];
    const updatedBuildingReviews = [...(buildingDoc.reviews || []), createdReview.$id];

    console.log("🛠 [Debug] Updating User & Building with new review...");

    await databases.updateDocument(
      config.databaseId!,
      config.usersCollectionId!,
      userId,
      { reviews: updatedUserReviews } // Pass as array
    );

    await databases.updateDocument(
      config.databaseId!,
      config.buildingsCollectionId!,
      buildingId,
      { reviews: updatedBuildingReviews } // Pass as array
    );

    console.log("✅ [Debug] Review successfully linked to User and Building.");
    return true;
  } catch (error) {
    console.error("❌ [Error] createReview failed:", JSON.stringify(error, null, 2));
    return false;
  }
};













