import { supabase } from "./supabase";

export interface Room {
  room_id: string;
  name: string;
  description?: string;
  room_type: 'medical' | 'treatment' | 'consultation' | 'diagnostic' | 'other';
  capacity?: number;
  equipment?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateRoomData {
  name: string;
  description?: string;
  room_type: Room['room_type'];
  capacity?: number;
  equipment?: string[];
  is_active?: boolean;
}

export interface UpdateRoomData extends Partial<CreateRoomData> {}

// Get all rooms
export const getRooms = async () => {
  const response = await supabase
    .from("rooms")
    .select("*")
    .order("name", { ascending: true });

  return response;
};

// Get active rooms only
export const getActiveRooms = async () => {
  const response = await supabase
    .from("rooms")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  return response;
};

// Get rooms by type
export const getRoomsByType = async (roomType: Room['room_type']) => {
  const response = await supabase
    .from("rooms")
    .select("*")
    .eq("room_type", roomType)
    .eq("is_active", true)
    .order("name", { ascending: true });

  return response;
};

// Get room by ID
export const getRoomById = async (roomId: string) => {
  const response = await supabase
    .from("rooms")
    .select("*")
    .eq("room_id", roomId)
    .single();

  return response;
};

// Create new room
export const createRoom = async (roomData: CreateRoomData) => {
  const response = await supabase
    .from("rooms")
    .insert([{
      ...roomData,
      is_active: roomData.is_active ?? true,
    }])
    .select()
    .single();

  return response;
};

// Update room
export const updateRoom = async (roomId: string, roomData: UpdateRoomData) => {
  const response = await supabase
    .from("rooms")
    .update({
      ...roomData,
      updated_at: new Date().toISOString(),
    })
    .eq("room_id", roomId)
    .select()
    .single();

  return response;
};

// Delete room (soft delete by setting is_active to false)
export const deleteRoom = async (roomId: string) => {
  const response = await supabase
    .from("rooms")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq("room_id", roomId);

  return response;
};

// Hard delete room (permanent deletion)
export const permanentDeleteRoom = async (roomId: string) => {
  const response = await supabase
    .from("rooms")
    .delete()
    .eq("room_id", roomId);

  return response;
};

// Check if room name exists
export const checkRoomNameExists = async (name: string, excludeRoomId?: string) => {
  let query = supabase
    .from("rooms")
    .select("room_id")
    .eq("name", name)
    .eq("is_active", true);

  if (excludeRoomId) {
    query = query.neq("room_id", excludeRoomId);
  }

  const response = await query.maybeSingle();
  return { exists: !!response.data, ...response };
};

// Get room statistics
export const getRoomStatistics = async () => {
  const response = await supabase
    .from("rooms")
    .select("room_type, is_active");

  if (response.error) {
    return response;
  }

  const stats = {
    total: response.data.length,
    active: response.data.filter(room => room.is_active).length,
    inactive: response.data.filter(room => !room.is_active).length,
    byType: {} as Record<Room['room_type'], number>
  };

  // Count by type
  response.data.forEach(room => {
    if (room.is_active && room.room_type) {
      const roomType = room.room_type as Room['room_type'];
      stats.byType[roomType] = (stats.byType[roomType] || 0) + 1;
    }
  });

  return { data: stats, error: null };
};