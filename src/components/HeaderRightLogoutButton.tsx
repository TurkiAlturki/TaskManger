import React from 'react';
import { Button, Alert } from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebaseConfig';

export default function HeaderRightLogoutButton() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      Alert.alert('Logout Error', error.message);
    }
  };

  return <Button title="Logout" onPress={handleLogout} />;
}
