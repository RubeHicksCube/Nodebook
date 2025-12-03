import React from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Node, ModuleConfig } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarModuleProps {
  nodes: Node[];
  config: ModuleConfig;
  isLoading?: boolean;
}

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Node;
}

export function CalendarModule({ nodes, config, isLoading }: CalendarModuleProps) {
  const [view, setView] = React.useState<View>((config.defaultView as View) || 'month');
  const [date, setDate] = React.useState(new Date());

  const dateField = config.dateField || 'date';
  const titleField = config.titleField || 'name';

  // Transform nodes into calendar events
  const events = React.useMemo<CalendarEvent[]>(() => {
    return nodes
      .map((node) => {
        const dateValue = node.content[dateField];
        if (!dateValue) return null;

        const startDate = new Date(dateValue);
        if (isNaN(startDate.getTime())) return null;

        // Check if there's an end date field
        const endDateValue = node.content[`${dateField}End`] || node.content.endDate;
        const endDate = endDateValue ? new Date(endDateValue) : startDate;

        return {
          id: node.id,
          title: node.content[titleField] || node.name,
          start: startDate,
          end: endDate,
          resource: node,
        };
      })
      .filter((event): event is CalendarEvent => event !== null);
  }, [nodes, dateField, titleField]);

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const handleViewChange = (newView: View) => {
    setView(newView);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const node = event.resource;
    const backgroundColor = node.color || '#3174ad';

    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.9,
        color: 'white',
        border: 'none',
        display: 'block',
      },
    };
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">Loading calendar...</div>
        </CardContent>
      </Card>
    );
  }

  if (nodes.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">No Events</p>
            <p className="text-sm mt-2">Add nodes with date fields to display them on the calendar</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = new Date(date);
                if (view === 'month') {
                  newDate.setMonth(newDate.getMonth() - 1);
                } else if (view === 'week') {
                  newDate.setDate(newDate.getDate() - 7);
                } else {
                  newDate.setDate(newDate.getDate() - 1);
                }
                handleNavigate(newDate);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleNavigate(new Date())}>
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = new Date(date);
                if (view === 'month') {
                  newDate.setMonth(newDate.getMonth() + 1);
                } else if (view === 'week') {
                  newDate.setDate(newDate.getDate() + 7);
                } else {
                  newDate.setDate(newDate.getDate() + 1);
                }
                handleNavigate(newDate);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="font-medium ml-2">
              {format(date, view === 'month' ? 'MMMM yyyy' : 'MMMM d, yyyy')}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={view === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewChange('month')}
            >
              Month
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewChange('week')}
            >
              Week
            </Button>
            <Button
              variant={view === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewChange('day')}
            >
              Day
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto calendar-container">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            view={view}
            onView={handleViewChange}
            date={date}
            onNavigate={handleNavigate}
            eventPropGetter={eventStyleGetter}
            style={{ height: '100%' }}
            popup
            className="bg-background text-foreground"
          />
        </div>

        <style>{`
          .calendar-container .rbc-calendar {
            font-family: inherit;
          }
          .calendar-container .rbc-header {
            padding: 8px 4px;
            font-weight: 600;
            border-color: hsl(var(--border));
            background: hsl(var(--muted));
          }
          .calendar-container .rbc-today {
            background-color: hsl(var(--accent));
          }
          .calendar-container .rbc-off-range-bg {
            background-color: hsl(var(--muted) / 0.3);
          }
          .calendar-container .rbc-event {
            padding: 2px 4px;
            font-size: 0.875rem;
          }
          .calendar-container .rbc-event:focus {
            outline: 2px solid hsl(var(--ring));
          }
          .calendar-container .rbc-month-view,
          .calendar-container .rbc-time-view,
          .calendar-container .rbc-agenda-view {
            border-color: hsl(var(--border));
          }
          .calendar-container .rbc-day-slot .rbc-time-slot {
            border-color: hsl(var(--border));
          }
          .calendar-container .rbc-time-content {
            border-color: hsl(var(--border));
          }
          .calendar-container .rbc-time-header-content {
            border-color: hsl(var(--border));
          }
          .calendar-container .rbc-month-row {
            border-color: hsl(var(--border));
          }
          .calendar-container .rbc-day-bg {
            border-color: hsl(var(--border));
          }
          .calendar-container .rbc-current-time-indicator {
            background-color: hsl(var(--primary));
          }
        `}</style>
      </CardContent>
    </Card>
  );
}
