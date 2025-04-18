import React, { useEffect, useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Pressable,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { collection, onSnapshot, query, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import HeaderRightLogoutButton from "../components/HeaderRightLogoutButton";
import { NavigationType } from "../type";

export default function TaskListScreen() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<{ [uid: string]: string }>({});
  const [selectedTab, setSelectedTab] = useState<"to-do" | "inprogress" | "done">("to-do");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [sortMode, setSortMode] = useState<"priority" | "deadline">("priority");
  const [searchText, setSearchText] = useState<string>("");
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const navigation = useNavigation<NavigationType>();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => <HeaderRightLogoutButton />,
    });
  }, [navigation]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const userMap: { [uid: string]: string } = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        userMap[doc.id] = data.username || data.email;
      });
      setUsers(userMap);
    };

    const unsubscribe = onSnapshot(query(collection(db, "tasks")), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTasks(data);
    });

    fetchUsers();
    return () => unsubscribe();
  }, []);

  const filteredTasks = tasks
    .filter((task) => task.status === selectedTab)
    .filter((task) => {
      if (selectedUser === "all") return true;
      if (selectedTab === "to-do") return task.publisher === selectedUser;
      return task.responsible === selectedUser;
    })
    .filter((task) => {
      const text = searchText.toLowerCase();
      return (
        task.title?.toLowerCase().includes(text) ||
        task.description?.toLowerCase().includes(text)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.deadLine?.toDate?.() || a.deadLine || 0).getTime();
      const dateB = new Date(b.deadLine?.toDate?.() || b.deadLine || 0).getTime();
      if (sortMode === "priority") {
        const priorityDiff = (a.priorities ?? 3) - (b.priorities ?? 3);
        if (priorityDiff !== 0) return priorityDiff;
      }
      return dateA - dateB;
    });

  const getPriorityEmoji = (priority: number) => {
    if (priority === 1) return "🔥";
    if (priority === 2) return "⚠️";
    return "🟢";
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.tabContainer}>
          {["to-do", "inprogress", "done"].map((tab) => (
            <Pressable
              key={tab}
              style={[styles.tabButton, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab as any)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
                {tab.replace("-", " ").toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Filters */}
        <Text style={styles.label}>Filter by {selectedTab === "to-do" ? "Publisher" : "Responsible"}:</Text>
        <TouchableOpacity onPress={() => setUserModalVisible(true)} style={styles.selectorButton}>
          <Text>{selectedUser === "all" ? "👀 All Users" : users[selectedUser]}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Sort By:</Text>
        <TouchableOpacity onPress={() => setSortModalVisible(true)} style={styles.selectorButton}>
          <Text>
            {sortMode === "priority" ? "🔥 Priority → 📅 Deadline" : "📅 Deadline Only"}
          </Text>
        </TouchableOpacity>

        <Text style={styles.label}>Search:</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search in title or description"
          value={searchText}
          onChangeText={setSearchText}
        />

        {/* Task List */}
        {filteredTasks.map((item) => {
          const deadline = item.deadLine?.toDate?.() || new Date(item.deadLine);
          return (
            <Pressable
              key={item.id}
              onPress={() => navigation.navigate("TaskDetail", { taskId: item.id })}
              style={styles.taskItem}
            >
              <Text style={styles.taskTitle}>{item.title}</Text>
              <Text style={styles.taskDetail}>Publisher: {users[item.publisher] || "Unknown"}</Text>
              <Text style={styles.taskDetail}>Responsible: {users[item.responsible] || "Unassigned"}</Text>
              <Text style={styles.taskDetail}>
                Priority: {item.priorities} {getPriorityEmoji(item.priorities)}
              </Text>
              <Text style={styles.taskDetail}>Deadline: {deadline.toLocaleString()}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Fixed Button */}
      <View style={styles.addButtonWrapper}>
        <Button title="Add New Task" onPress={() => navigation.navigate("AddTask")} />
      </View>

      {/* User Modal */}
      <Modal visible={userModalVisible} animationType="slide">
        <View style={styles.modalContent}>
          <Text style={styles.label}>Select User</Text>
          <ScrollView>
            <TouchableOpacity onPress={() => { setSelectedUser("all"); setUserModalVisible(false); }}>
              <Text style={styles.modalOption}>👀 All Users</Text>
            </TouchableOpacity>
            {Object.entries(users).map(([uid, name]) => (
              <TouchableOpacity key={uid} onPress={() => { setSelectedUser(uid); setUserModalVisible(false); }}>
                <Text style={styles.modalOption}>{name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Sort Modal */}
      <Modal visible={sortModalVisible} animationType="slide">
        <View style={styles.modalContent}>
          <Text style={styles.label}>Sort By</Text>
          <TouchableOpacity onPress={() => { setSortMode("priority"); setSortModalVisible(false); }}>
            <Text style={styles.modalOption}>🔥 Priority → 📅 Deadline</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setSortMode("deadline"); setSortModalVisible(false); }}>
            <Text style={styles.modalOption}>📅 Deadline Only</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 100, // extra space for bottom button
    backgroundColor: "#fff",
  },
  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    padding: 12,
    backgroundColor: "#eee",
    alignItems: "center",
    borderRadius: 6,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: "#007AFF",
  },
  tabText: {
    fontWeight: "600",
    color: "#333",
  },
  activeTabText: {
    color: "#fff",
  },
  label: {
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 4,
  },
  selectorButton: {
    padding: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: "#f9f9f9",
    marginBottom: 10,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  taskItem: {
    backgroundColor: "#f5f5f5",
    padding: 14,
    borderRadius: 6,
    marginBottom: 10,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  taskDetail: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  addButtonWrapper: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
  },
  modalContent: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  modalOption: {
    fontSize: 16,
    paddingVertical: 12,
    borderBottomColor: "#eee",
    borderBottomWidth: 1,
  },
});
