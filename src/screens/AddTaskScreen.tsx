// ... all imports remain unchanged
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
import DateTimePickerModal from "react-native-modal-datetime-picker";
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

  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [showDatePickerIOS, setShowDatePickerIOS] = useState(false);
  const [showTimePickerIOS, setShowTimePickerIOS] = useState(false);

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

  const handleConfirmAndroid = (selectedDate: Date) => {
    setDeadline(selectedDate);
    setDatePickerVisibility(false);
  };

  const handleDateChangeIOS = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDeadline(
        (prev) =>
          new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            prev.getHours(),
            prev.getMinutes()
          )
      );
    }
    setShowDatePickerIOS(false);
  };

  const handleTimeChangeIOS = (event: any, selectedTime?: Date) => {
    if (selectedTime) {
      setDeadline(
        (prev) =>
          new Date(
            prev.getFullYear(),
            prev.getMonth(),
            prev.getDate(),
            selectedTime.getHours(),
            selectedTime.getMinutes()
          )
      );
    }
    setShowTimePickerIOS(false);
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
          <View style={styles.deadlineBox}>
            <Text style={styles.deadlineText}>{deadline.toLocaleString()}</Text>
          </View>

          {Platform.OS === "web" ? (
            <input
              type="datetime-local"
              value={new Date(deadline).toISOString().slice(0, 16)}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                if (!isNaN(newDate.getTime())) setDeadline(newDate);
              }}
              style={{
                padding: 10,
                borderRadius: 5,
                borderColor: "#ccc",
                borderWidth: 1,
                marginBottom: 10,
                fontSize: 16,
              }}
            />
          ) : Platform.OS === "android" ? (
            <>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setDatePickerVisibility(true)}
              >
                <Text style={styles.dateButtonText}>📅 Pick Deadline</Text>
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="datetime"
                date={deadline}
                onConfirm={handleConfirmAndroid}
                onCancel={() => setDatePickerVisibility(false)}
              />
            </>
          ) : (
            <>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePickerIOS(true)}
              >
                <Text style={styles.dateButtonText}>📅 Pick Date</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowTimePickerIOS(true)}
              >
                <Text style={styles.dateButtonText}>⏰ Pick Time</Text>
              </TouchableOpacity>

              {showDatePickerIOS && (
                <DateTimePicker
                  value={deadline}
                  mode="date"
                  display="default"
                  onChange={handleDateChangeIOS}
                />
              )}

              {showTimePickerIOS && (
                <DateTimePicker
                  value={deadline}
                  mode="time"
                  display="default"
                  onChange={handleTimeChangeIOS}
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
  deadlineBox: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  deadlineText: { color: "#000", fontSize: 16, fontWeight: "500" },
});
