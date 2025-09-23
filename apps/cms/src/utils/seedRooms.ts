import { createRoom, type CreateRoomData } from '@nam-viet-erp/services';

const sampleRooms: CreateRoomData[] = [
  {
    name: 'Phòng Tiêm Chủng',
    description: 'Phòng dành riêng cho việc tiêm phòng vaccine cho trẻ em và người lớn',
    room_type: 'medical',
    capacity: 3,
    equipment: ['Tủ lạnh vaccine', 'Bàn khám', 'Ghế tiêm', 'Máy đo huyết áp'],
    is_active: true,
  },
  {
    name: 'Phòng Siêu Âm',
    description: 'Phòng chẩn đoán hình ảnh bằng siêu âm',
    room_type: 'diagnostic',
    capacity: 2,
    equipment: ['Máy siêu âm', 'Giường khám', 'Máy in ảnh', 'Gel siêu âm'],
    is_active: true,
  },
  {
    name: 'Phòng Khám Tổng Quát',
    description: 'Phòng khám bệnh tổng quát cho các trường hợp không chuyên biệt',
    room_type: 'consultation',
    capacity: 4,
    equipment: ['Bàn khám', 'Ống nghe', 'Máy đo huyết áp', 'Cân điện tử', 'Đèn khám'],
    is_active: true,
  },
  {
    name: 'Phòng Nội Soi',
    description: 'Phòng thực hiện các thủ thuật nội soi chẩn đoán',
    room_type: 'diagnostic',
    capacity: 2,
    equipment: ['Máy nội soi', 'Giường thủ thuật', 'Màn hình hiển thị', 'Thiết bị tiệt trùng'],
    is_active: true,
  },
  {
    name: 'Phòng Điều Trị',
    description: 'Phòng điều trị các bệnh lý không cần phẫu thuật',
    room_type: 'treatment',
    capacity: 6,
    equipment: ['Giường bệnh', 'Máy theo dõi', 'Bơm tiêm', 'Tủ thuốc'],
    is_active: true,
  },
  {
    name: 'Phòng X-Quang',
    description: 'Phòng chụp X-quang chẩn đoán',
    room_type: 'diagnostic',
    capacity: 2,
    equipment: ['Máy X-quang', 'Bàn chụp', 'Áo chì bảo hộ', 'Máy in phim'],
    is_active: true,
  },
  {
    name: 'Phòng Cấp Cứu',
    description: 'Phòng xử lý các trường hợp cấp cứu y tế',
    room_type: 'medical',
    capacity: 5,
    equipment: ['Giường cấp cứu', 'Máy khử rung tim', 'Máy thở', 'Tủ thuốc cấp cứu', 'Thiết bị theo dõi'],
    is_active: true,
  },
  {
    name: 'Phòng Nghỉ Bệnh Nhân',
    description: 'Phòng nghỉ ngơi sau khi thực hiện các thủ thuật',
    room_type: 'other',
    capacity: 8,
    equipment: ['Giường nghỉ', 'Tủ đồ', 'Bàn ghế'],
    is_active: true,
  },
];

export const seedRooms = async () => {
  console.log('🌱 Bắt đầu tạo dữ liệu mẫu cho phòng...');

  for (const roomData of sampleRooms) {
    try {
      const { error } = await createRoom(roomData);
      if (error) {
        console.error(`❌ Lỗi tạo phòng "${roomData.name}":`, error.message);
      } else {
        console.log(`✅ Đã tạo phòng: ${roomData.name}`);
      }
    } catch (error) {
      console.error(`❌ Lỗi tạo phòng "${roomData.name}":`, error);
    }
  }

  console.log('🎉 Hoàn thành tạo dữ liệu mẫu cho phòng!');
};

// Utility function to delete all rooms (for testing)
export const clearAllRooms = async () => {
  console.log('🗑️ Đang xóa tất cả dữ liệu phòng...');

  try {
    const { getRooms, permanentDeleteRoom } = await import('@nam-viet-erp/services');
    const { data: rooms, error } = await getRooms();

    if (error) {
      console.error('❌ Lỗi lấy danh sách phòng:', error.message);
      return;
    }

    if (!rooms || rooms.length === 0) {
      console.log('ℹ️ Không có phòng nào để xóa');
      return;
    }

    for (const room of rooms) {
      try {
        const { error: deleteError } = await permanentDeleteRoom(room.room_id);
        if (deleteError) {
          console.error(`❌ Lỗi xóa phòng "${room.name}":`, deleteError.message);
        } else {
          console.log(`🗑️ Đã xóa phòng: ${room.name}`);
        }
      } catch (error) {
        console.error(`❌ Lỗi xóa phòng "${room.name}":`, error);
      }
    }

    console.log('🎉 Hoàn thành xóa tất cả dữ liệu phòng!');
  } catch (error) {
    console.error('❌ Lỗi trong quá trình xóa dữ liệu:', error);
  }
};

// Make functions available in browser console for testing
if (typeof window !== 'undefined') {
  (window as any).seedRooms = seedRooms;
  (window as any).clearAllRooms = clearAllRooms;
}