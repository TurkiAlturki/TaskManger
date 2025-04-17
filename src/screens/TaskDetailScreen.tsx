import React, { useEffect, useState, useLayoutEffect } from "react";
import { View, Text, TextInput, Button, FlatList } from "react-native";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import { db, auth } from "../../firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import HeaderRightLogoutButton from "../components/HeaderRightLogoutButton";

type TaskDetailRouteProp = RouteProp<{ params: { taskId: string } }, "params">;

export default function TaskDetailScreen() {
  const { params } = useRoute<TaskDetailRouteProp>();
  const { taskId } = params;

  const [task, setTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <HeaderRightLogoutButton />,
    });
  }, [navigation]);

  useEffect(() => {
    const fetchTask = async () => {
      const docRef = doc(db, "tasks", taskId);
      const snapshot = await getDoc(docRef);
      setTask({ id: snapshot.id, ...snapshot.data() });
    };

    fetchTask();

    const commentRef = collection(db, `tasks/${taskId}/comments`);
    const q = query(commentRef, orderBy("date", "asc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, []);

  const addComment = async () => {
    if (!newComment.trim()) return;
    await addDoc(collection(db, `tasks/${taskId}/comments`), {
      commenter_name: auth.currentUser?.email || "Anonymous",
      date: new Date(),
      description: newComment,
    });
    setNewComment("");
  };

  return (
    <View>
      <Text>Task: {task?.description}</Text>
      <Text>Priority: {task?.priorities}</Text>
      <Text>Status: {task?.status}</Text>
      {task?.deadLine && (
        <Text style={{ marginBottom: 10 }}>
          Deadline: {task.deadLine.toDate().toLocaleString()}
        </Text>
      )}

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text>
            {item.commenter_name}: {item.description}
          </Text>
        )}
      />

      <TextInput
        placeholder="Write a comment..."
        value={newComment}
        onChangeText={setNewComment}
      />
      <Button title="Add Comment" onPress={addComment} />
    </View>
  );
}
