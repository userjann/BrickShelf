import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    expo: {
      ...config.expo,
      // Deine Expo-Eigenschaften, die du vorher hattest:
      name: "BrickShelf",
      slug: "brickshelf", // Muss zu deinem Slug auf Expo.dev passen
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/icon.png",
      userInterfaceStyle: "light",
      splash: {
        image: "./assets/splash.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      },
      assetBundlePatterns: [
        "**/*"
      ],
      ios: {
        supportsTablet: true
      },
      android: {
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#ffffff" // <--- HIER WAR DER FEHLER (Doppelpunkt statt Anführungszeichen)
        },
        package: "com.jannosch12.brickshelf" // Passe dies an deine Domain an!
      },
      web: {
        favicon: "./assets/favicon.png"
      },
      // Füge hier den 'owner' direkt im 'expo'-Objekt hinzu
      owner: "jannosch12", // <-- DEINEN EXPO-BENUTZERNAMEN HIER EINTRAGEN!
      extra: {
        ...config.expo?.extra,
        eas: {
          projectId: "a70a6769-49d5-4e93-aa26-257cd9b37c64", // <-- DEINE NEUE, KORREKTE PROJECT ID HIER EINTRAGEN!
        },
      },
    },
  };
};