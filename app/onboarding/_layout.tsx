import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="language" />
      <Stack.Screen name="theme" />
      <Stack.Screen name="habit" />
      <Stack.Screen name="reasons" />
      <Stack.Screen name="pin" />
      <Stack.Screen name="welcome" />
    </Stack>
  );
}
