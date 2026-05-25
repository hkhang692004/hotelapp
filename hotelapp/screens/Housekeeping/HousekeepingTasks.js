import { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    StatusBar,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    Modal,
    Pressable,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { MyUserContext } from "../../configs/Contexts";
import { authApis, BASE_URL, endpoints } from "../../configs/Apis";

const WS_URL = `${BASE_URL.replace(/^http/, "ws").replace(/\/api\/v1$/, "")}/ws/housekeeping/`;

const STATUS_META = {
    pending: { label: "Chờ xử lý", color: "#F59E0B", icon: "clock-outline" },
    in_progress: { label: "Đang dọn", color: "#3B82F6", icon: "progress-clock" },
    completed: { label: "Hoàn tất", color: "#7FB069", icon: "check-circle-outline" },
    cancelled: { label: "Đã hủy", color: "#8B8B98", icon: "close-circle-outline" },
};

const PRIORITY_META = {
    high: { label: "Cao", color: "#E05252" },
    normal: { label: "Thường", color: "#C9A84C" },
    low: { label: "Thấp", color: "#5B9BD5" },
};

const TYPE_LABEL = {
    checkout_clean: "Dọn sau checkout",
    daily_clean: "Dọn định kỳ",
    maintenance: "Bảo trì",
};

const ACTION_LABEL = {
    created: "Tạo task",
    assigned: "Giao task",
    pending_to_in_progress: "Bắt đầu dọn",
    in_progress_to_completed: "Hoàn tất dọn",
    pending_to_cancelled: "Hủy task",
    in_progress_to_cancelled: "Hủy task",
};

const formatLogAction = (action) => ACTION_LABEL[action] ?? action;

const SCOPE_TABS = [
    { key: "me", label: "Task của tôi" },
    { key: "unassigned", label: "Task chung" },
];

const STATUS_TABS = [
    { key: "pending", label: "Chờ xử lý" },
    { key: "in_progress", label: "Đang dọn" },
    { key: "completed", label: "Hoàn tất" },
];

const formatDateTime = (value) => {
    if (!value) return "";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const pickList = (res) => {
    const data = res?.data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.data?.results)) return data.data.results;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data)) return data;
    return [];
};

const uniqueById = (items) => {
    if (!Array.isArray(items)) return [];
    const seen = new Set();
    return items.filter((item) => {
        const id = item?.id;
        if (id === null || id === undefined) return false;
        const key = String(id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const pickErrorMessage = (e, fallback) => {
    const payload = e?.response?.data;
    const err = payload?.error ?? payload;
    if (typeof err === "string") return err;
    if (typeof err?.message === "string") return err.message;
    if (typeof payload?.message === "string") return payload.message;
    return fallback;
};

const FilterChip = ({ active, label, onPress }) => (
    <TouchableOpacity
        style={[styles.chip, active && styles.chipActive]}
        onPress={onPress}
        activeOpacity={0.8}
    >
        <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
);

const TaskCard = ({ item, canOperate, onStart, onComplete, onCancel, onOpenLogs }) => {
    const statusMeta = STATUS_META[item.status] ?? STATUS_META.pending;
    const priorityMeta = PRIORITY_META[item.priority] ?? PRIORITY_META.normal;
    const room = item.room ?? {};

    return (
        <View style={styles.card}>
            <View style={styles.cardTop}>
                <View>
                    <Text style={styles.roomNo}>Phòng {room.room_number ?? "--"}</Text>
                    <Text style={styles.floorText}>Tầng {room.floor ?? "--"}</Text>
                </View>
                <View style={styles.rightBadges}>
                    <View style={[styles.badge, { backgroundColor: priorityMeta.color + "22" }]}>
                        <Text style={[styles.badgeText, { color: priorityMeta.color }]}>{priorityMeta.label}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: statusMeta.color + "22" }]}>
                        <MaterialCommunityIcons name={statusMeta.icon} size={13} color={statusMeta.color} />
                        <Text style={[styles.badgeText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.typeText}>{TYPE_LABEL[item.task_type] ?? item.task_type}</Text>
            {item.notes ? <Text style={styles.noteText}>{item.notes}</Text> : null}

            <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Được giao:</Text>
                <Text style={styles.metaValue}>{item.assigned_to?.full_name ?? "Chưa giao"}</Text>
            </View>
            <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Tạo lúc:</Text>
                <Text style={styles.metaValue}>{formatDateTime(item.created_at)}</Text>
            </View>

            <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={onOpenLogs}>
                    <MaterialCommunityIcons name="history" size={15} color="#A9ADBC" />
                    <Text style={styles.secondaryBtnText}>Lịch sử</Text>
                </TouchableOpacity>

                {canOperate && item.status === "pending" ? (
                    <TouchableOpacity style={styles.primaryBtn} onPress={onStart}>
                        <MaterialCommunityIcons name="play" size={15} color="#1A1A2E" />
                        <Text style={styles.primaryBtnText}>Bắt đầu</Text>
                    </TouchableOpacity>
                ) : null}

                {canOperate && item.status === "in_progress" ? (
                    <TouchableOpacity style={styles.successBtn} onPress={onComplete}>
                        <MaterialCommunityIcons name="check" size={16} color="#0F1A13" />
                        <Text style={styles.successBtnText}>Hoàn tất</Text>
                    </TouchableOpacity>
                ) : null}
            </View>
        </View>
    );
};

const NoteModal = ({ visible, title, confirmLabel, confirmColor = "#C9A84C", onClose, onConfirm }) => {
    const [note, setNote] = useState("");
    const inputRef = useRef(null);

    const handleConfirm = () => {
        const trimmed = note.trim();
        onConfirm(trimmed);
        setNote("");
    };

    const handleClose = () => {
        setNote("");
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <KeyboardAvoidingView
                style={styles.noteOverlay}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <View style={styles.noteBox}>
                    <Text style={styles.noteBoxTitle}>{title}</Text>
                    <TextInput
                        ref={inputRef}
                        style={styles.noteInput}
                        placeholder="Nhập ghi chú (không bắt buộc)"
                        placeholderTextColor="#666"
                        value={note}
                        onChangeText={setNote}
                        multiline
                        numberOfLines={3}
                        autoFocus
                    />
                    <View style={styles.noteActions}>
                        <TouchableOpacity style={styles.noteCancelBtn} onPress={handleClose}>
                            <Text style={styles.noteCancelText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.noteConfirmBtn, { backgroundColor: confirmColor }]}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.noteConfirmText}>{confirmLabel}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const LogsModal = ({ visible, onClose, loading, logs }) => (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Lịch sử tác vụ</Text>
                <TouchableOpacity onPress={onClose}>
                    <MaterialCommunityIcons name="close" size={20} color="#A9ADBC" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator color="#C9A84C" style={{ marginTop: 24 }} />
            ) : logs.length === 0 ? (
                <View style={styles.emptyModal}>
                    <MaterialCommunityIcons name="history" size={38} color="#555" />
                    <Text style={styles.emptyModalText}>Chưa có log cho task này</Text>
                </View>
            ) : (
                <FlatList
                    data={logs}
                    keyExtractor={(item, idx) => `${item.timestamp || idx}`}
                    renderItem={({ item }) => (
                        <View style={styles.logItem}>
                            <Text style={styles.logAction}>{formatLogAction(item.action)}</Text>
                            <Text style={styles.logMeta}>Bởi: {item.performed_by_name || "Hệ thống"}</Text>
                            {item.note ? <Text style={styles.logNote}>{item.note}</Text> : <Text style={styles.logNote}>Không có ghi chú</Text>}
                            <Text style={styles.logTime}>{formatDateTime(item.timestamp)}</Text>
                        </View>
                    )}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </View>
    </Modal>
);

const HousekeepingTasks = ({ navigation }) => {
    const [user, dispatch] = useContext(MyUserContext);
    const wsRef = useRef(null);
    const reconnectTimerRef = useRef(null);
    const [scope, setScope] = useState("me");
    const [statusFilter, setStatusFilter] = useState("pending");
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busyTaskId, setBusyTaskId] = useState(null);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    const [logsVisible, setLogsVisible] = useState(false);
    const [logsLoading, setLogsLoading] = useState(false);
    const [logs, setLogs] = useState([]);

    const [noteModal, setNoteModal] = useState({ visible: false, title: "", confirmLabel: "", confirmColor: "#C9A84C", onConfirm: null });

    const openNoteModal = (title, confirmLabel, confirmColor, onConfirm) => {
        setNoteModal({ visible: true, title, confirmLabel, confirmColor, onConfirm });
    };
    const closeNoteModal = () => setNoteModal((p) => ({ ...p, visible: false }));

    const canOperateTask = (task) => {
        if (user?.role !== "housekeeping") return true;
        if (!task?.assigned_to?.id) return true;
        return task.assigned_to.id === user?.id;
    };

    const loadTasks = useCallback(async ({ silent = false, pageNum = 1, append = false } = {}) => {
        if (!user?.token) return;
        if (!silent && !append) setLoading(true);
        if (append) setLoadingMore(true);
        try {
            const params = {
                assigned_to: scope,
                status: statusFilter,
                page: pageNum,
                page_size: 5,
            };
            const res = await authApis(user.token).get(endpoints.housekeepingTasks, { params });
            const newTasks = pickList(res);
            const meta = res?.data?.meta ?? {};
            const currentPage = meta.page ?? pageNum;
            const totalPages = meta.total_pages ?? 1;
            setPage(currentPage);
            setHasMore(currentPage < totalPages);
            setTotalCount(meta.total_count ?? 0);
            if (append) {
                setTasks((prev) => uniqueById([...prev, ...newTasks]));
            } else {
                setTasks(uniqueById(newTasks));
            }
        } catch (e) {
            Alert.alert("Lỗi", pickErrorMessage(e, "Không tải được danh sách task."));
        } finally {
            setLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [user?.token, scope, statusFilter]);

    const loadMore = useCallback(() => {
        if (loadingMore || !hasMore) return;
        loadTasks({ append: true, pageNum: page + 1 });
    }, [loadingMore, hasMore, page, loadTasks]);

    useFocusEffect(
        useCallback(() => {
            loadTasks();

            // Tự động cập nhật mỗi 30 giây khi màn hình đang mở
            const timer = setInterval(() => {
                loadTasks({ silent: true });
            }, 30_000);

            return () => clearInterval(timer);
        }, [loadTasks])
    );

    // WebSocket: nhận sự kiện task_update từ backend và reload ngay, tự reconnect khi mất kết nối.
    useEffect(() => {
        let unmounted = false;

        const connect = () => {
            if (unmounted) return;
            const ws = new WebSocket(WS_URL);
            wsRef.current = ws;

            ws.onmessage = () => {
                loadTasks({ silent: true });
            };

            ws.onclose = () => {
                if (unmounted) return;
                reconnectTimerRef.current = setTimeout(connect, 3000);
            };

            ws.onerror = () => {
                ws.close();
            };
        };

        connect();

        return () => {
            unmounted = true;
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }
            wsRef.current?.close();
        };
    }, [loadTasks]);

    const onRefresh = () => {
        setRefreshing(true);
        loadTasks({ silent: true });
    };

    const updateTaskStatus = async (task, nextStatus, note = "") => {
        if (!canOperateTask(task)) {
            Alert.alert("Không có quyền", "Bạn không thể thao tác task được giao cho người khác.");
            return;
        }
        setBusyTaskId(task.id);
        try {
            await authApis(user.token).patch(endpoints.housekeepingTaskDetail(task.id), {
                status: nextStatus,
                notes: note,
            });
            await loadTasks({ silent: true });
        } catch (e) {
            Alert.alert("Cập nhật thất bại", pickErrorMessage(e, "Không thể cập nhật trạng thái task."));
        } finally {
            setBusyTaskId(null);
        }
    };

    const handleStartTask = (task) => {
        updateTaskStatus(task, "in_progress");
    };

    const handleCompleteTask = (task) => {
        openNoteModal(
            `Hoàn tất dọn phòng ${task?.room?.room_number || ""}`,
            "Hoàn tất",
            "#7FB069",
            (note) => {
                closeNoteModal();
                updateTaskStatus(task, "completed", note);
            }
        );
    };

    const handleCancelTask = (task) => {
        Alert.alert(
            "Hủy task",
            `Bạn chắc chắn muốn hủy task phòng ${task?.room?.room_number || ""}?`,
            [
                { text: "Không", style: "cancel" },
                { text: "Hủy task", style: "destructive", onPress: () => updateTaskStatus(task, "cancelled") },
            ]
        );
    };

    const handleOpenLogs = async (task) => {
        setLogsVisible(true);
        setLogsLoading(true);
        setLogs([]);
        try {
            const res = await authApis(user.token).get(endpoints.housekeepingTaskLogs(task.id));
            const data = res?.data;
            const list = Array.isArray(data?.data)
                ? data.data
                : Array.isArray(data)
                ? data
                : [];
            setLogs(list);
        } catch (e) {
            Alert.alert("Lỗi", pickErrorMessage(e, "Không tải được lịch sử task."));
        } finally {
            setLogsLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Đăng xuất",
            "Bạn có chắc muốn đăng xuất không?",
            [
                { text: "Huỷ", style: "cancel" },
                {
                    text: "Đăng xuất",
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.removeItem("access_token");
                        await AsyncStorage.removeItem("refresh_token");
                        dispatch({ type: "LOGOUT" });
                        navigation.replace("login");
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor="#1A1A2E" />
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Xin chào,</Text>
                    <Text style={styles.name}>{user?.full_name || "Nhân viên"}</Text>
                </View>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <MaterialCommunityIcons name="logout" size={20} color="#E05252" />
                    <Text style={styles.logoutText}>Đăng xuất</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.filtersWrap}>
                <FlatList
                    horizontal
                    data={SCOPE_TABS}
                    keyExtractor={(it) => it.key}
                    contentContainerStyle={styles.chipsRow}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <FilterChip
                            label={item.label}
                            active={scope === item.key}
                            onPress={() => setScope(item.key)}
                        />
                    )}
                />
                <FlatList
                    horizontal
                    data={STATUS_TABS}
                    keyExtractor={(it) => it.key}
                    contentContainerStyle={styles.chipsRow}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <FilterChip
                            label={item.label}
                            active={statusFilter === item.key}
                            onPress={() => setStatusFilter(item.key)}
                        />
                    )}
                />
            </View>

            {loading ? (
                <ActivityIndicator color="#C9A84C" style={{ marginTop: 32 }} />
            ) : (
                <FlatList
                    data={tasks}
                    keyExtractor={(item) => String(item.id)}
                    contentContainerStyle={styles.listWrap}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A84C" />}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.3}
                    renderItem={({ item }) => (
                        <View style={{ opacity: busyTaskId === item.id ? 0.6 : 1 }}>
                            <TaskCard
                                item={item}
                                canOperate={canOperateTask(item)}
                                onStart={() => handleStartTask(item)}
                                onComplete={() => handleCompleteTask(item)}
                                onCancel={() => handleCancelTask(item)}
                                onOpenLogs={() => handleOpenLogs(item)}
                            />
                        </View>
                    )}
                    ListFooterComponent={
                        <View style={styles.paginationWrap}>
                            {loadingMore ? (
                                <ActivityIndicator color="#C9A84C" style={{ marginVertical: 8 }} />
                            ) : hasMore ? (
                                <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore} activeOpacity={0.8}>
                                    <Text style={styles.loadMoreText}>Tải thêm</Text>
                                </TouchableOpacity>
                            ) : totalCount > 0 ? (
                                <Text style={styles.paginationDone}>Đã hiển thị tất cả task</Text>
                            ) : null}
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <MaterialCommunityIcons name="clipboard-text-clock-outline" size={54} color="#4A4A5A" />
                            <Text style={styles.emptyTitle}>Không có task phù hợp</Text>
                            <Text style={styles.emptySub}>Đổi bộ lọc hoặc kéo xuống để làm mới danh sách.</Text>
                        </View>
                    }
                />
            )}

            <LogsModal
                visible={logsVisible}
                onClose={() => setLogsVisible(false)}
                loading={logsLoading}
                logs={logs}
            />
            <NoteModal
                visible={noteModal.visible}
                title={noteModal.title}
                confirmLabel={noteModal.confirmLabel}
                confirmColor={noteModal.confirmColor}
                onClose={closeNoteModal}
                onConfirm={noteModal.onConfirm ?? (() => {})}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#1A1A2E",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.07)",
    },
    greeting: {
        fontSize: 13,
        color: "#888",
    },
    name: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
    },
    logoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: "rgba(224, 82, 82, 0.12)",
        borderWidth: 1,
        borderColor: "rgba(224, 82, 82, 0.35)",
    },
    logoutText: {
        color: "#E05252",
        fontSize: 13,
        fontWeight: "700",
    },
    body: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    text: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#fff",
    },
    filtersWrap: {
        paddingHorizontal: 12,
        paddingTop: 10,
        gap: 8,
    },
    chipsRow: {
        paddingHorizontal: 4,
        gap: 8,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: "#24253C",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    chipActive: {
        borderColor: "rgba(201,168,76,0.55)",
        backgroundColor: "rgba(201,168,76,0.15)",
    },
    chipText: {
        color: "#9EA3B5",
        fontSize: 12,
        fontWeight: "600",
    },
    chipTextActive: {
        color: "#E8D49C",
    },
    listWrap: {
        padding: 14,
        paddingBottom: 32,
    },
    card: {
        backgroundColor: "#23243B",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.07)",
        marginBottom: 10,
    },
    cardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    rightBadges: {
        alignItems: "flex-end",
        gap: 6,
    },
    roomNo: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "800",
    },
    floorText: {
        color: "#9095A6",
        fontSize: 12,
        marginTop: 2,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: "700",
    },
    typeText: {
        color: "#D9DCE9",
        fontSize: 13,
        fontWeight: "700",
        marginBottom: 4,
    },
    noteText: {
        color: "#A9ADBC",
        fontSize: 13,
        lineHeight: 18,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 3,
    },
    metaLabel: {
        color: "#7F8498",
        fontSize: 12,
        width: 64,
    },
    metaValue: {
        color: "#BEC3D3",
        fontSize: 12,
        flex: 1,
    },
    actionsRow: {
        marginTop: 12,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    secondaryBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#2D2F49",
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    secondaryBtnText: {
        color: "#A9ADBC",
        fontSize: 12,
        fontWeight: "700",
    },
    primaryBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#C9A84C",
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    primaryBtnText: {
        color: "#1A1A2E",
        fontSize: 12,
        fontWeight: "800",
    },
    successBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#7FB069",
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    successBtnText: {
        color: "#0F1A13",
        fontSize: 12,
        fontWeight: "800",
    },
    dangerBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: "#7A2B35",
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    dangerBtnText: {
        color: "#FFE6E6",
        fontSize: 12,
        fontWeight: "700",
    },
    emptyBox: {
        alignItems: "center",
        marginTop: 64,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        color: "#C9CDDA",
        marginTop: 10,
        fontSize: 16,
        fontWeight: "700",
    },
    emptySub: {
        color: "#74798B",
        marginTop: 6,
        fontSize: 13,
        textAlign: "center",
    },
    paginationWrap: { alignItems: "center", marginTop: 4, marginBottom: 4 },
    paginationDone: { color: "#666", fontSize: 12, marginTop: 2 },
    loadMoreBtn: {
        alignSelf: "center",
        backgroundColor: "#23243B",
        borderWidth: 1,
        borderColor: "rgba(201,168,76,0.35)",
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    loadMoreText: { color: "#C9A84C", fontWeight: "600", fontSize: 13 },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(9, 10, 19, 0.66)",
    },
    modalSheet: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        maxHeight: "75%",
        backgroundColor: "#1F2034",
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        borderTopWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    modalHandle: {
        alignSelf: "center",
        width: 50,
        height: 5,
        borderRadius: 999,
        backgroundColor: "#50536A",
        marginTop: 10,
        marginBottom: 10,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    modalTitle: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 16,
    },
    emptyModal: {
        alignItems: "center",
        paddingVertical: 30,
        gap: 8,
    },
    emptyModalText: {
        color: "#8A8FA3",
        fontSize: 13,
    },
    logItem: {
        backgroundColor: "#282A42",
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
    },
    logAction: {
        color: "#F2F4FA",
        fontSize: 13,
        fontWeight: "700",
    },
    logMeta: {
        color: "#A9ADBC",
        fontSize: 12,
        marginTop: 4,
    },
    logNote: {
        color: "#C3C7D5",
        fontSize: 12,
        marginTop: 2,
    },
    logTime: {
        color: "#7E8396",
        fontSize: 11,
        marginTop: 6,
    },
    noteOverlay: {
        flex: 1,
        backgroundColor: "rgba(9,10,19,0.72)",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    noteBox: {
        backgroundColor: "#1F2034",
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    noteBoxTitle: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 14,
    },
    noteInput: {
        backgroundColor: "#282A42",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        color: "#fff",
        fontSize: 14,
        paddingHorizontal: 12,
        paddingVertical: 10,
        minHeight: 80,
        textAlignVertical: "top",
    },
    noteActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 14,
    },
    noteCancelBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: "#2D2F49",
    },
    noteCancelText: {
        color: "#A9ADBC",
        fontWeight: "700",
        fontSize: 13,
    },
    noteConfirmBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 10,
    },
    noteConfirmText: {
        color: "#1A1A2E",
        fontWeight: "800",
        fontSize: 13,
    },
});

export default HousekeepingTasks;
