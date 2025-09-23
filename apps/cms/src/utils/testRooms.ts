import {
  getRooms,
  createRoom,
  getRoomStatistics,
  checkRoomNameExists,
  type CreateRoomData
} from '@nam-viet-erp/services';

// Test room management functionality
export const testRoomManagement = async () => {
  console.log('🧪 Testing Room Management Functions...');

  try {
    // 1. Test getting initial room statistics
    console.log('\n📊 1. Getting initial room statistics:');
    const { data: initialStats, error: statsError } = await getRoomStatistics();
    if (statsError) throw statsError;
    console.log('Initial stats:', initialStats);

    // 2. Test getting all rooms
    console.log('\n📋 2. Getting all rooms:');
    const { data: rooms, error: roomsError } = await getRooms();
    if (roomsError) throw roomsError;
    console.log(`Found ${rooms?.length || 0} rooms`);

    // 3. Test creating a new room
    console.log('\n➕ 3. Testing room creation:');
    const testRoomData: CreateRoomData = {
      name: 'Phòng Test - ' + Date.now(),
      description: 'Phòng được tạo để test chức năng',
      room_type: 'other',
      capacity: 5,
      equipment: ['Thiết bị test 1', 'Thiết bị test 2'],
      is_active: true
    };

    // Check if name exists first
    const { exists } = await checkRoomNameExists(testRoomData.name);
    console.log(`Room name exists: ${exists}`);

    if (!exists) {
      const { data: newRoom, error: createError } = await createRoom(testRoomData);
      if (createError) throw createError;
      console.log('✅ Successfully created test room:', newRoom?.name);

      // 4. Test getting updated statistics
      console.log('\n📊 4. Getting updated room statistics:');
      const { data: updatedStats, error: updatedStatsError } = await getRoomStatistics();
      if (updatedStatsError) throw updatedStatsError;
      console.log('Updated stats:', updatedStats);
    }

    console.log('\n🎉 All room management tests completed successfully!');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message || error);
  }
};

// Make function available in browser console
if (typeof window !== 'undefined') {
  (window as any).testRoomManagement = testRoomManagement;
  console.log('💡 Run testRoomManagement() in console to test room functionality');
}