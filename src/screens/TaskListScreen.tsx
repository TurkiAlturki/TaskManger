import React, { useEffect, useState, useLayoutEffect } from "react";
import { View, FlatList, Text, Button, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import HeaderRightLogoutButton from "../components/HeaderRightLogoutButton";
import { NavigationType } from "../type";

export default function TaskListScreen() {
  const [tasks, setTasks] = useState<any[]>([]);
  const navigation = useNavigation<NavigationType>();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <HeaderRightLogoutButton />,
    });
  }, [navigation]);

  useEffect(() => {
    const q = query(
      collection(db, "tasks"),
      //where("userID", "==", auth.currentUser?.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTasks(data);
    });

    return () => unsub();
  }, []);

  return (
    <View>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("TaskDetail", { taskId: item.id })
            }
          >
            <Text>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
      <Button
        title="Add New Task"
        onPress={() => navigation.navigate("AddTask")}
      />
    </View>
  );
}
