-- Add room_id field to appointments table
-- This allows assigning patients to specific rooms for their appointments

-- Add the room_id column as a foreign key reference to rooms table
ALTER TABLE public.appointments
ADD COLUMN room_id UUID REFERENCES public.rooms(room_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_appointments_room_id ON public.appointments(room_id);

-- Create composite index for common queries (room + date)
CREATE INDEX IF NOT EXISTS idx_appointments_room_date ON public.appointments(room_id, scheduled_datetime);

-- Add comment for documentation
COMMENT ON COLUMN public.appointments.room_id IS 'Reference to the room where the appointment will take place';

-- Optional: Update existing appointments to assign them to a default room
-- (Uncomment and modify as needed based on your data)
/*
-- Example: Assign all existing appointments to the first available room
UPDATE public.appointments
SET room_id = (
    SELECT room_id
    FROM public.rooms
    WHERE is_active = true
    ORDER BY name
    LIMIT 1
)
WHERE room_id IS NULL;
*/

-- Optional: Add constraint to ensure appointments have rooms assigned
-- (Uncomment if you want to make room assignment mandatory)
/*
ALTER TABLE public.appointments
ADD CONSTRAINT appointments_room_required
CHECK (room_id IS NOT NULL);
*/