import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, isToday, isTomorrow } from 'date-fns';

interface BookingCalendarProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedTime: string | null;
  setSelectedTime: (time: string | null) => void;
  durationMinutes?: number;
}

// Generate time slots based on provider availability
const generateTimeSlots = (date: Date) => {
  const slots = [];
  const startHour = 9; // 9 AM
  const endHour = 17;  // 5 PM
  
  for (let i = startHour; i < endHour; i++) {
    slots.push(`${i.toString().padStart(2, '0')}:00`);
    slots.push(`${i.toString().padStart(2, '0')}:30`);
  }
  return slots;
};

export const BookingCalendar = ({ 
  selectedDate, 
  setSelectedDate, 
  selectedTime, 
  setSelectedTime,
  durationMinutes 
}: BookingCalendarProps) => {
  const [timeSlots] = useState(generateTimeSlots(selectedDate || new Date()));

  const getLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'EEEE, MMM d');
  };

  // Simple calendar UI
  const renderCalendarDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 14; i++) {
      const date = addDays(today, i);
      const isSelected = selectedDate && format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
      
      days.push(
        <button
          key={i}
          onClick={() => setSelectedDate(date)}
          className={cn(
            "flex flex-col items-center justify-center min-w-[70px] h-20 rounded-lg border-2 transition-all",
            isSelected 
              ? "border-black bg-black text-white" 
              : "border-gray-200 hover:border-gray-300 bg-white"
          )}
        >
          <span className="text-xs font-medium uppercase">{format(date, 'EEE')}</span>
          <span className="text-xl font-bold">{format(date, 'd')}</span>
        </button>
      );
    }
    return days;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Date</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {renderCalendarDays()}
        </div>
      </div>

      {selectedDate && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Available Times for {getLabel(selectedDate)}
          </h3>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {timeSlots.map((time) => (
              <Button
                key={time}
                variant={selectedTime === time ? 'default' : 'outline'}
                className={cn(
                  "h-10 text-sm",
                  selectedTime === time && "bg-black text-white hover:bg-black/90"
                )}
                onClick={() => setSelectedTime(time)}
              >
                {time}
              </Button>
            ))}
          </div>
          
          {durationMinutes && (
            <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Estimated duration: {durationMinutes} minutes
            </p>
          )}
        </div>
      )}
    </div>
  );
};
