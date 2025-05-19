import React, { useState, useLayoutEffect } from "react";
import {
  View,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  Text,
  Platform,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Modal from "react-native-modal";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import HeaderRightLogoutButton from "../components/HeaderRightLogoutButton";

export default function AddTaskScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("1");
  const [deadline, setDeadline] = useState(new Date());

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isPriorityModalVisible, setPriorityModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <HeaderRightLogoutButton />,
    });
  }, [navigation]);

  const handleAddTask = async () => {
    if (!title.trim()) return Alert.alert("Title is required");
    if (!description.trim()) return Alert.alert("Description is required");

    try {
      setLoading(true);
      await addDoc(collection(db, "tasks"), {
        title,
        description,
        priority: Number(priority),
        status: "to-do",
        deadline: Timestamp.fromDate(deadline),
        actual_time: 0,
        publisher: auth.currentUser?.uid,
        responsible: null,
      });

      Alert.alert("Success", "Task added!");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDeadline((prev) => new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        prev.getHours(),
        prev.getMinutes()
      ));
    }
    setShowDatePicker(false);
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setDeadline((prev) => new Date(
        prev.getFullYear(),
        prev.getMonth(),
        prev.getDate(),
        selectedTime.getHours(),
        selectedTime.getMinutes()
      ));
    }
    setShowTimePicker(false);
  };

  // Format for <input type="datetime-local" /> in local time (not UTC)
  const formatDateTimeLocal = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const yyyy = date.getFullYear();
    const MM = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          <Text style={styles.label}>Task Title:</Text>
          <TextInput
            style={styles.input}
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>Task Description:</Text>
          <TextInput
            style={styles.input}
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.label}>Priority:</Text>
          <TouchableOpacity
            style={styles.priorityButton}
            onPress={() => setPriorityModalVisible(true)}
          >
            <Text style={styles.priorityButtonText}>
              {priority === "1"
                ? "🔥 High (1)"
                : priority === "2"
                ? "⚠️ Medium (2)"
                : "🟢 Low (3)"}
            </Text>
          </TouchableOpacity>

          <Modal
            isVisible={isPriorityModalVisible}
            onBackdropPress={() => setPriorityModalVisible(false)}
            backdropOpacity={0.3}
          >
            <View style={styles.modalContent}>
              {[
                { label: "🔥 High (1)", value: "1" },
                { label: "⚠️ Medium (2)", value: "2" },
                { label: "🟢 Low (3)", value: "3" },
              ].map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={styles.modalItem}
                  onPress={() => {
                    setPriority(item.value);
                    setPriorityModalVisible(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Modal>

          <Text style={styles.label}>Deadline:</Text>

          {Platform.OS === "web" ? (
            <>
              <input
                type="datetime-local"
                value={formatDateTimeLocal(deadline)}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  if (!isNaN(newDate.getTime())) setDeadline(newDate);
                }}
                style={{
                  padding: 10,
                  borderRadius: 5,
                  borderColor: "#ccc",
                  borderWidth: 1,
                  marginBottom: 5,
                  fontSize: 16,
                  width: "100%",
                }}
              />
              <Text style={{ marginBottom: 15, color: "#555" }}>
                Selected: {deadline.toLocaleString()}
              </Text>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>📅 Pick Date</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={styles.dateButtonText}>⏰ Pick Time</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={deadline}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
              {showTimePicker && (
                <DateTimePicker
                  value={deadline}
                  mode="time"
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </>
          )}

          <View style={{ marginTop: 20 }}>
            <Button
              title={loading ? "Adding..." : "Add Task"}
              onPress={handleAddTask}
              disabled={loading}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  container: { padding: 20, flex: 1, backgroundColor: "#fff" },
  input: {
    borderColor: "#888",
    borderWidth: 1,
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  label: { fontWeight: "bold", marginBottom: 5 },
  priorityButton: {
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 5,
    padding: 12,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  priorityButtonText: { fontSize: 16, fontWeight: "600", color: "#333" },
  modalContent: { backgroundColor: "white", padding: 20, borderRadius: 8 },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  modalItemText: { fontSize: 16, color: "#007AFF", textAlign: "center" },
  dateButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
  },
  dateButtonText: { color: "#fff", fontWeight: "bold" },
});
