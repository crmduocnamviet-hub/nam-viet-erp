-- Create rooms table for Nam Viet ERP
-- This table stores information about medical rooms/facilities

CREATE TABLE IF NOT EXISTS public.rooms (
    room_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    room_type VARCHAR(50) NOT NULL CHECK (room_type IN ('medical', 'treatment', 'consultation', 'diagnostic', 'other')),
    capacity INTEGER CHECK (capacity > 0),
    equipment TEXT[] DEFAULT '{}', -- Array of equipment names
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rooms_name ON public.rooms(name);
CREATE INDEX IF NOT EXISTS idx_rooms_type ON public.rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_rooms_active ON public.rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_rooms_type_active ON public.rooms(room_type, is_active);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_rooms_updated_at ON public.rooms;
CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.rooms IS 'Medical rooms and facilities management';
COMMENT ON COLUMN public.rooms.room_id IS 'Unique identifier for the room';
COMMENT ON COLUMN public.rooms.name IS 'Room name (must be unique)';
COMMENT ON COLUMN public.rooms.description IS 'Optional room description';
COMMENT ON COLUMN public.rooms.room_type IS 'Type of room: medical, treatment, consultation, diagnostic, or other';
COMMENT ON COLUMN public.rooms.capacity IS 'Maximum number of people the room can accommodate';
COMMENT ON COLUMN public.rooms.equipment IS 'Array of equipment available in the room';
COMMENT ON COLUMN public.rooms.is_active IS 'Whether the room is currently active/available';
COMMENT ON COLUMN public.rooms.created_at IS 'Timestamp when room was created';
COMMENT ON COLUMN public.rooms.updated_at IS 'Timestamp when room was last updated';

-- Grant necessary permissions (adjust based on your RLS policies)
-- ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;