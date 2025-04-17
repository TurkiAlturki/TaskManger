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

  // 🔹 State definitions
  const [task, setTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [users, setUsers] = useState<{ [uid: string]: string }>({});
  const [selectedUser, setSelectedUser] = useState("");
  const [editingFields, setEditingFields] = useState({
    title: false,
    description: false,
    priorities: false,
  });

  const currentUser = auth.currentUser;

  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <HeaderRightLogoutButton /> });
  }, [navigation]);

  useEffect(() => {
    fetchTask();
    fetchUsers();
    const unsub = onSnapshot(
      query(collection(db, `tasks/${taskId}/comments`), orderBy("date", "asc")),
      (snapshot) => {
        setComments(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      }
    );
    return () => unsub();
  }, []);

  const fetchTask = async () => {
    const docRef = doc(db, "tasks", taskId);
    const snapshot = await getDoc(docRef);
    const taskData = { id: snapshot.id, ...snapshot.data() };
    setTask(taskData);
    setSelectedUser(taskData.responsible || "unassign");
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
      {task && (
        <View style={styles.taskInfo}>
          {/* Editable Title */}
          {editingFields.title ? (
            <TextInput
              style={styles.input}
              value={task.title}
              onChangeText={(text) =>
                setTask((prev: any) => ({ ...prev, title: text }))
              }
              onBlur={() => {
                setEditingFields({ ...editingFields, title: false });
                updateField("title", task.title);
              }}
              autoFocus
            />
          ) : (
            <TouchableOpacity
              onLongPress={() =>
                setEditingFields({ ...editingFields, title: true })
              }
            >
              <Text style={styles.title}>{task.title}</Text>
            </TouchableOpacity>
          )}

          {/* Editable Description */}
          {editingFields.description ? (
            <TextInput
              style={styles.input}
              value={task.description}
              onChangeText={(text) =>
                setTask((prev: any) => ({ ...prev, description: text }))
              }
              onBlur={() => {
                setEditingFields({ ...editingFields, description: false });
                updateField("description", task.description);
              }}
              multiline
              autoFocus
            />
          ) : (
            <TouchableOpacity
              onLongPress={() =>
                setEditingFields({ ...editingFields, description: true })
              }
            >
              <Text style={styles.desc}>{task.description}</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.detail}>
            Publisher: {users[task.publisher] || task.publisher}
          </Text>

          <Text style={styles.detail}>
            Responsible: {users[task.responsible] || "Unassigned"}
          </Text>

          {/* Editable Priority */}
          {editingFields.priorities ? (
            <TextInput
              style={styles.input}
              value={task.priorities}
              onChangeText={(text) =>
                setTask((prev: any) => ({ ...prev, priorities: text }))
              }
              onBlur={() => {
                setEditingFields({ ...editingFields, priorities: false });
                updateField("priorities", task.priorities);
              }}
              autoFocus
            />
          ) : (
            <TouchableOpacity
              onLongPress={() =>
                setEditingFields({ ...editingFields, priorities: true })
              }
            >
              <Text style={styles.detail}>Priority: {task.priorities}</Text>
            </TouchableOpacity>
          )}

          {task.deadLine?.toDate && (
            <Text style={styles.detail}>
              Deadline: {task.deadLine.toDate().toLocaleString()}
            </Text>
          )}
          <Text style={styles.detail}>status: {task.status}</Text>
          <Picker
            selectedValue={task.responsible || "unassign"}
            onValueChange={(value) => {
              setSelectedUser(value);
              if (value === "unassign") {
                unassignUser();
              } else if (value) {
                assignUser(value);
              }
            }}
            style={{ marginVertical: 10 }}
          >
            <Picker.Item label="Unassign" value="unassign" />
            {Object.entries(users).map(([uid, username]) => (
              <Picker.Item key={uid} label={username} value={uid} />
            ))}
          </Picker>

          {task.status === "inprogress" &&
            task.responsible === currentUser?.uid && (
              <Button
                title="Mark as Done ✅"
                color="green"
                onPress={markAsDone}
              />
            )}
        </View>
      )}

      <Text style={styles.sectionHeader}>Comments</Text>
      <FlatList
        style={styles.commentList}
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
                    <Text style={styles.deleteText}>🗑 Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
              {editingId === item.id ? (
                <TextInput
                  value={editingText}
                  onChangeText={setEditingText}
                  onBlur={() => saveEditedComment(item.id)}
                  onSubmitEditing={() => saveEditedComment(item.id)}
                  style={styles.editInput}
                  autoFocus
                />
              ) : (
                <TouchableOpacity
                  onLongPress={() =>
                    isOwner && startEditing(item.id, item.description)
                  }
                >
                  <Markdown>{item.description}</Markdown>
                </TouchableOpacity>
              )}
              <Text style={styles.commentDate}>
                {item.date?.toDate &&
                  new Date(item.date.toDate()).toLocaleString()}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  taskInfo: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#f0f4f8",
    borderRadius: 8,
  },
  title: { fontSize: 20, fontWeight: "bold" },
  desc: { fontSize: 16, marginVertical: 8, color: "#333" },
  detail: { fontSize: 15, color: "#555", marginVertical: 2 },
  sectionHeader: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  commentList: { flex: 1 },
  commentItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    backgroundColor: "#fafafa",
    borderRadius: 6,
    marginBottom: 6,
  },
  commentHeader: { flexDirection: "row", justifyContent: "space-between" },
  commentAuthor: { fontWeight: "bold" },
  commentDate: { fontSize: 12, color: "#888", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  editInput: {
    borderColor: "#007AFF",
    borderWidth: 1,
    borderRadius: 5,
    padding: 6,
    backgroundColor: "#f8f8f8",
    marginVertical: 4,
  },
  reactionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    alignItems: "center",
    flexWrap: "wrap",
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
  deleteText: {
    color: "red",
    fontSize: 13,
    fontWeight: "600",
  },
});
