import React, { useEffect, useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import HeaderRightLogoutButton from "../components/HeaderRightLogoutButton";
import Markdown from "react-native-markdown-display";

type TaskDetailRouteProp = RouteProp<{ params: { taskId: string } }, "params">;

export default function TaskDetailScreen() {
  const { taskId } = useRoute<TaskDetailRouteProp>().params;
  const navigation = useNavigation<any>();
  const currentUser = auth.currentUser;

  const [task, setTask] = useState<any>(null);
  const [loadingTask, setLoadingTask] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [users, setUsers] = useState<{ [uid: string]: string }>({});
  const [selectedUser, setSelectedUser] = useState("");
  const [editingFields, setEditingFields] = useState({
    title: false,
    description: false,
    priority: false,
  });

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <HeaderRightLogoutButton /> });
  }, [navigation]);

  useEffect(() => {
    fetchTask();
    fetchUsers();
    const unsub = onSnapshot(
      query(collection(db, `tasks/${taskId}/comments`), orderBy("date", "asc")),
      (snapshot) => {
        setComments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      }
    );
    return () => unsub();
  }, []);

  const fetchTask = async () => {
    try {
      const docRef = doc(db, "tasks", taskId);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) {
        console.warn("Task not found:", taskId);
        setTask(null);
        setLoadingTask(false);
        return;
      }
      const taskData = { id: snapshot.id, ...snapshot.data() };
      setTask(taskData);
      setSelectedUser(taskData.responsible || "unassign");
    } catch (error) {
      console.error("Failed to fetch task:", error);
    } finally {
      setLoadingTask(false);
    }
  };

  const fetchUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const map: { [uid: string]: string } = {};
    snapshot.forEach((doc) => {
      const data = doc.data();
      map[doc.id] = data.username || data.email;
    });
    setUsers(map);
  };

  const updateField = async (field: string, value: string) => {
    if (!task) return;
    await updateDoc(doc(db, "tasks", task.id), { [field]: value });
    fetchTask();
  };

  const assignUser = async (uid: string) => {
    await updateDoc(doc(db, "tasks", taskId), {
      responsible: uid,
      status: "inprogress",
    });
    fetchTask();
  };

  const unassignUser = async () => {
    await updateDoc(doc(db, "tasks", taskId), {
      responsible: "",
      status: "to-do",
    });
    fetchTask();
  };

  const markAsDone = async () => {
    await updateDoc(doc(db, "tasks", taskId), { status: "done" });
    fetchTask();
  };

  const handleFieldEdit = (field: keyof typeof editingFields) => {
    setEditingFields((prev) => ({ ...prev, [field]: true }));
  };

  const renderEditableField = (
    field: keyof typeof editingFields,
    label: string,
    value: string,
    multiline: boolean = false
  ) => {
    return editingFields[field] ? (
      <TextInput
        style={[styles.input, multiline && { minHeight: 100 }]}
        value={value}
        onChangeText={(text) =>
          setTask((prev: any) => ({ ...prev, [field]: text }))
        }
        onBlur={() => {
          setEditingFields((prev) => ({ ...prev, [field]: false }));
          updateField(field, task[field]);
        }}
        multiline={multiline}
        autoFocus
      />
    ) : (
      <TouchableOpacity
        style={styles.editRow}
        onLongPress={() => handleFieldEdit(field)}
      >
        <Text style={styles.detail}>
          {label}: {value}
        </Text>
        <TouchableOpacity onPress={() => handleFieldEdit(field)}>
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const addComment = async () => {
    const text = newComment.trim();
    if (!text) return;

    await addDoc(collection(db, `tasks/${taskId}/comments`), {
      commenter_name:
        users[currentUser?.uid || ""] || currentUser?.email || "Anonymous",
      commenter_uid: currentUser?.uid || "Empty",
      date: new Date(),
      description: text,
      reactions: {},
    });
    setNewComment("");
  };

  const startEditing = (id: string, text: string) => {
    setEditingId(id);
    setEditingText(text);
  };

  const saveEditedComment = async (id: string) => {
    if (!editingText.trim()) return;
    await updateDoc(doc(db, `tasks/${taskId}/comments`, id), {
      description: editingText.trim(),
    });
    setEditingId(null);
    setEditingText("");
  };

  const deleteComment = async (id: string) => {
    await deleteDoc(doc(db, `tasks/${taskId}/comments`, id));
  };

  const addReaction = async (commentId: string, emoji: string) => {
    if (!currentUser?.uid) return;
    const commentRef = doc(db, `tasks/${taskId}/comments`, commentId);
    const snapshot = await getDoc(commentRef);
    const reactions = snapshot.data()?.reactions || {};
    reactions[currentUser.uid] = emoji;
    await updateDoc(commentRef, { reactions });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {loadingTask ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
        ) : task ? (
          <View style={styles.taskInfo}>
            {renderEditableField("title", "Title", task.title)}
            {renderEditableField("description", "Description", task.description, true)}
            {renderEditableField("priority", "Priority", task.priority)}

            <Text style={styles.detail}>
              Publisher: {users[task.publisher] || task.publisher}
            </Text>
            <Text style={styles.detail}>
              Responsible: {users[task.responsible] || "Unassigned"}
            </Text>
            {task.deadline?.toDate && (
              <Text style={styles.detail}>
                Deadline: {task.deadline.toDate().toLocaleString()}
              </Text>
            )}
            <Text style={styles.detail}>Status: {task.status}</Text>

            <Picker
              selectedValue={selectedUser}
              onValueChange={(value) => {
                setSelectedUser(value);
                value === "unassign" ? unassignUser() : assignUser(value);
              }}
              style={{ marginVertical: 10 }}
            >
              <Picker.Item label="Unassign" value="unassign" />
              {Object.entries(users).map(([uid, name]) => (
                <Picker.Item key={uid} label={name} value={uid} />
              ))}
            </Picker>

            {task.status === "inprogress" && task.responsible === currentUser?.uid && (
              <Button title="Mark as Done ✅" color="green" onPress={markAsDone} />
            )}
          </View>
        ) : (
          <Text style={{ textAlign: "center", marginTop: 40, fontSize: 16 }}>
            ❌ Task not found.
          </Text>
        )}

        <Text style={styles.sectionHeader}>Comments</Text>
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isOwner = item.commenter_uid === currentUser?.uid;
            const userReaction = item.reactions?.[currentUser?.uid];

            return (
              <View style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{item.commenter_name}</Text>
                  {isOwner && (
                    <TouchableOpacity onPress={() => deleteComment(item.id)}>
                      <Text style={styles.deleteText}>🗑</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {editingId === item.id ? (
                  <TextInput
                    value={editingText}
                    onChangeText={setEditingText}
                    onBlur={() => saveEditedComment(item.id)}
                    autoFocus
                    style={styles.editInput}
                  />
                ) : (
                  <TouchableOpacity
                    onLongPress={() => isOwner && startEditing(item.id, item.description)}
                  >
                    <Markdown>{item.description}</Markdown>
                  </TouchableOpacity>
                )}
                <Text style={styles.commentDate}>
                  {item.date?.toDate && new Date(item.date.toDate()).toLocaleString()}
                </Text>
                <View style={styles.reactionRow}>
                  {["👍", "❤️", "😂"].map((emoji) => {
                    const count = Object.values(item.reactions || {}).filter(
                      (r) => r === emoji
                    ).length;
                    return (
                      <TouchableOpacity
                        key={emoji}
                        onPress={() => addReaction(item.id, emoji)}
                        style={[
                          styles.reactionButton,
                          userReaction === emoji && styles.selectedEmoji,
                        ]}
                      >
                        <Text style={styles.emoji}>
                          {emoji} {count > 0 ? count : ""}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          }}
        />

        <TextInput
          style={styles.input}
          placeholder="Write a comment..."
          value={newComment}
          onChangeText={setNewComment}
          returnKeyType="send"
          onSubmitEditing={addComment}
        />
        <Button title="Add Comment" onPress={addComment} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { padding: 16, flexGrow: 1 },
  taskInfo: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#f0f4f8",
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  editInput: {
    borderColor: "#007AFF",
    borderWidth: 1,
    borderRadius: 5,
    padding: 6,
    backgroundColor: "#f8f8f8",
    marginVertical: 4,
  },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  editIcon: {
    fontSize: 18,
    marginLeft: 10,
  },
  detail: { fontSize: 15, color: "#555", marginVertical: 2 },
  sectionHeader: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  commentItem: {
    padding: 12,
    backgroundColor: "#fafafa",
    borderRadius: 6,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  commentHeader: { flexDirection: "row", justifyContent: "space-between" },
  commentAuthor: { fontWeight: "bold" },
  commentDate: { fontSize: 12, color: "#888", marginTop: 4 },
  deleteText: {
    color: "red",
    fontWeight: "600",
    fontSize: 14,
  },
  reactionRow: {
    flexDirection: "row",
    marginTop: 6,
    flexWrap: "wrap",
    alignItems: "center",
  },
  reactionButton: {
    marginRight: 10,
    padding: 4,
    borderRadius: 6,
  },
  selectedEmoji: {
    backgroundColor: "#d0ebff",
  },
  emoji: {
    fontSize: 16,
  },
});
