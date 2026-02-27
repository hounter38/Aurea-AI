import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  Alert,
  Platform,
} from "react-native";

const API_URL = __DEV__
  ? Platform.select({
      android: "http://10.0.2.2:4000",
      ios: "http://localhost:4000",
      default: "http://localhost:4000",
    })
  : "https://api.aurea.app";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [events, setEvents] = useState([]);
  const [inputText, setInputText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("inbox");

  const fetchData = useCallback(async () => {
    try {
      const [msgRes, evRes] = await Promise.all([
        fetch(`${API_URL}/api/messages`),
        fetch(`${API_URL}/api/events`),
      ]);
      const [msgData, evData] = await Promise.all([
        msgRes.json(),
        evRes.json(),
      ]);
      setMessages(msgData.messages);
      setEvents(evData.events);
    } catch (err) {
      console.log("Failed to fetch:", err.message);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const processMessage = async () => {
    if (!inputText.trim()) return;
    setProcessing(true);
    try {
      const res = await fetch(`${API_URL}/api/process-inline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: inputText,
          source: "sms",
          sender: "Mobile App",
        }),
      });
      const data = await res.json();
      Alert.alert(
        "Events Created",
        `${data.events_created} event(s) extracted and sent to calendar.`,
        [{ text: "OK" }]
      );
      setInputText("");
      await fetchData();
    } catch {
      Alert.alert("Error", "Failed to process message. Is the backend running?");
    }
    setProcessing(false);
  };

  const renderMessage = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardSource}>
          {item.source === "sms" ? "\u{1F4F1}" : item.source === "call" ? "\u{1F4DE}" : "\u{1F4E7}"}{" "}
          {item.sender}
        </Text>
        <Text style={[styles.cardStatus, { color: item.status === "processed" ? "#34d399" : "#fbbf24" }]}>
          {item.status}
        </Text>
      </View>
      <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
    </View>
  );

  const renderEvent = ({ item }) => (
    <View style={[styles.card, styles.eventCard]}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventMeta}>
        {item.type} &middot; {new Date(item.datetime).toLocaleString()}
      </Text>
      {item.notes && (
        <Text style={styles.eventNotes} numberOfLines={1}>{item.notes}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a1a" />

      <View style={styles.header}>
        <Text style={styles.title}>
          <Text style={styles.titleAccent}>Aurea</Text>
        </Text>
        <Text style={styles.subtitle}>Messages &rarr; AI &rarr; Calendar</Text>
      </View>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.textInput}
          placeholder="Paste or type a message..."
          placeholderTextColor="#666"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          style={[styles.processBtn, (!inputText.trim() || processing) && styles.btnDisabled]}
          onPress={processMessage}
          disabled={!inputText.trim() || processing}
        >
          <Text style={styles.btnText}>{processing ? "..." : "Process"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {["inbox", "calendar"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === "inbox" ? `Inbox (${messages.length})` : `Calendar (${events.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={activeTab === "inbox" ? messages : events}
        renderItem={activeTab === "inbox" ? renderMessage : renderEvent}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {activeTab === "inbox" ? "No messages yet" : "No calendar events yet"}
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a1a" },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  titleAccent: { color: "#818cf8" },
  subtitle: { fontSize: 13, color: "#666", marginTop: 2 },
  inputArea: {
    flexDirection: "row", paddingHorizontal: 16, paddingVertical: 8,
    gap: 8, alignItems: "flex-end",
  },
  textInput: {
    flex: 1, backgroundColor: "#1a1a2e", borderColor: "#333",
    borderWidth: 1, borderRadius: 12, padding: 12, color: "#fff",
    fontSize: 14, maxHeight: 100,
  },
  processBtn: {
    backgroundColor: "#4f46e5", paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  tabs: {
    flexDirection: "row", paddingHorizontal: 16, paddingTop: 12,
    gap: 8,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: "#1a1a2e", alignItems: "center",
  },
  activeTab: { backgroundColor: "#4f46e5" },
  tabText: { color: "#888", fontWeight: "600", fontSize: 13 },
  activeTabText: { color: "#fff" },
  list: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  card: {
    backgroundColor: "#1a1a2e", borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: "#222",
  },
  cardHeader: {
    flexDirection: "row", justifyContent: "space-between", marginBottom: 4,
  },
  cardSource: { color: "#ccc", fontSize: 13, fontWeight: "600" },
  cardStatus: { fontSize: 11, fontWeight: "600", textTransform: "uppercase" },
  cardBody: { color: "#aaa", fontSize: 13 },
  eventCard: { borderLeftWidth: 3, borderLeftColor: "#818cf8" },
  eventTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  eventMeta: { color: "#888", fontSize: 12, marginTop: 2 },
  eventNotes: { color: "#666", fontSize: 11, marginTop: 4 },
  empty: { color: "#555", textAlign: "center", marginTop: 40, fontSize: 14 },
});
