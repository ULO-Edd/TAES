import InitialLayout from "@/components/InitialLayout";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <InitialLayout />
      </NotificationProvider>
    </AuthProvider>
  );
}
