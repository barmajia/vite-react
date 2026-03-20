import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BookingCalendarProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedTime: string | null;
  setSelectedTime: (time: string | null) => void;
  durationMinutes?: number | null;
}

const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];

export function BookingCalendar({
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  durationMinutes,
}: BookingCalendarProps) {
  // Generate next 14 days
  const today = new Date();
  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return date;
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const isDateDisabled = (date: Date) => {
    // Disable weekends (optional - remove if you want to allow weekends)
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Select Date
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {availableDates.map((date) => {
            const disabled = isDateDisabled(date);
            const isSelected =
              selectedDate?.toDateString() === date.toDateString();

            return (
              <Button
                key={date.toISOString()}
                variant={isSelected ? "default" : "outline"}
                className={`h-20 flex flex-col gap-1 p-2 ${
                  disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => {
                  if (!disabled) {
                    setSelectedDate(date);
                    setSelectedTime(null); // Reset time when date changes
                  }
                }}
                disabled={disabled}
              >
                <span className="text-xs font-medium">
                  {date.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className="text-lg font-bold">{date.getDate()}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Time Selection */}
      {selectedDate && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Available Times</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {TIME_SLOTS.map((time) => {
              const isSelected = selectedTime === time;

              return (
                <Button
                  key={time}
                  variant={isSelected ? "default" : "outline"}
                  className="h-10"
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Duration Info */}
      {durationMinutes && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">Duration</Badge>
          <span>{durationMinutes} minutes</span>
        </div>
      )}

      {/* Selected Info */}
      {selectedDate && selectedTime && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm font-medium">Selected:</p>
            <p className="text-lg font-semibold">
              {formatDate(selectedDate)} at {selectedTime}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
