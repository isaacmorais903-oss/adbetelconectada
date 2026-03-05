import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Announcement, AnnouncementType } from '../types';
import { ChevronLeft, ChevronRight, X, Plus, Calendar as CalendarIcon, Clock, MapPin, Pencil } from 'lucide-react';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Announcement[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // New Event Form State
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventContent, setNewEventContent] = useState('');
  const [newEventType, setNewEventType] = useState<AnnouncementType>(AnnouncementType.EVENT);
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Announcement | null>(null);

  useEffect(() => {
    checkUserRole();
    fetchEvents();
  }, [currentDate]);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.email) {
      // Simple check based on email pattern as seen in other files or policies
      // Ideally this should be a robust role check, but for now we follow the pattern
      const adminEmails = ['admin', 'adm', 'pastor', 'lider', 'secretaria', 'tesouraria'];
      const isAdminUser = adminEmails.some(role => user.email?.includes(role));
      setIsAdmin(isAdminUser);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    // Fetch events for the current month (and maybe surrounding days to be safe)
    // For simplicity, let's fetch all events for now or filter by range if needed.
    // Given the likely volume, fetching all "Evento" type announcements might be okay, 
    // but filtering by month is better.
    
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .in('type', [AnnouncementType.EVENT, AnnouncementType.CULT, AnnouncementType.LECTURE, AnnouncementType.OTHER])
      .gte('date', startOfMonth.toISOString())
      .lte('date', endOfMonth.toISOString());

    if (error) {
      console.error('Error fetching events:', error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(clickedDate);
    setShowModal(true);
    setShowAddEventForm(false); // Reset form when opening modal
    setEditingEvent(null);
    setNewEventTitle('');
    setNewEventContent('');
    setNewEventType(AnnouncementType.EVENT);
  };

  const getEventsForDay = (day: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      // Fix timezone offset issue by comparing date strings or using UTC
      // Assuming event.date is YYYY-MM-DD or ISO
      // Let's use local date string comparison for simplicity
      // But supabase dates might be UTC. 
      // Let's treat the event.date as the day of the event.
      // We need to be careful with timezones.
      // If event.date is "2023-10-25", new Date("2023-10-25") is UTC.
      // Let's just compare YYYY-MM-DD parts.
      const eventDateStr = event.date.split('T')[0];
      const currentMonthStr = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const dayStr = day.toString().padStart(2, '0');
      const targetDateStr = `${currentDate.getFullYear()}-${currentMonthStr}-${dayStr}`;
      
      return eventDateStr === targetDateStr;
    });
  };

  const handleSaveEvent = async () => {
    if (!selectedDate || !newEventTitle || !newEventContent) return;

    try {
      if (editingEvent) {
        // Update existing event
        const { error } = await supabase
          .from('announcements')
          .update({
            title: newEventTitle,
            content: newEventContent,
            type: newEventType,
          })
          .eq('id', editingEvent.id);

        if (error) throw error;
      } else {
        // Create new event
        const { error } = await supabase
          .from('announcements')
          .insert([
            {
              title: newEventTitle,
              content: newEventContent,
              type: newEventType,
              date: selectedDate.toISOString().split('T')[0],
            }
          ]);

        if (error) throw error;
      }

      // Refresh events
      fetchEvents();
      setNewEventTitle('');
      setNewEventContent('');
      setNewEventType(AnnouncementType.EVENT);
      setEditingEvent(null);
      setShowAddEventForm(false);
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Erro ao salvar evento.');
    }
  };

  const handleEditEvent = (event: Announcement) => {
    setEditingEvent(event);
    setNewEventTitle(event.title);
    setNewEventContent(event.content);
    setNewEventType(event.type);
    setShowAddEventForm(true);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return;
    
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchEvents();
      // If no events left for this day, maybe close modal? No, keep it open.
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const renderCalendarDays = () => {
    const totalDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before start of month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800"></div>);
    }

    // Days of the month
    for (let day = 1; day <= totalDays; day++) {
      const dayEvents = getEventsForDay(day);
      const hasEvents = dayEvents.length > 0;
      const isToday = 
        day === new Date().getDate() && 
        currentDate.getMonth() === new Date().getMonth() && 
        currentDate.getFullYear() === new Date().getFullYear();

      days.push(
        <div 
          key={day} 
          onClick={() => handleDayClick(day)}
          className={`h-24 border border-gray-100 dark:border-slate-800 p-2 cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-slate-800 relative
            ${isToday ? 'bg-blue-50 dark:bg-slate-800' : 'bg-white dark:bg-slate-900'}
            ${hasEvents ? 'bg-red-50 dark:bg-red-900/10' : ''}
          `}
        >
          <div className={`font-semibold text-sm mb-1 
            ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}
            ${hasEvents ? 'text-red-600 dark:text-red-400' : ''}
          `}>
            {day}
          </div>
          
          {hasEvents && (
            <div className="flex flex-col gap-1">
              {dayEvents.slice(0, 2).map((event, idx) => (
                <div key={idx} className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded px-1 py-0.5 truncate">
                  {event.title}
                </div>
              ))}
              {dayEvents.length > 2 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                  +{dayEvents.length - 2} mais
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="p-6 max-w-7xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <CalendarIcon className="w-8 h-8 text-blue-600" />
          Calendário de Eventos
        </h1>
        
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
            <ChevronLeft className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </button>
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 min-w-[200px] text-center capitalize">
            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full">
            <ChevronRight className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-slate-800">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
          {weekDays.map(day => (
            <div key={day} className="py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>
        
        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Event Details Modal */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* List of Events */}
              <div className="space-y-4">
                {getEventsForDay(selectedDate.getDate()).length > 0 ? (
                  getEventsForDay(selectedDate.getDate()).map(event => (
                    <div key={event.id} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 shadow-sm relative group">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white text-lg">{event.title}</h4>
                          <p className="text-slate-600 dark:text-slate-300 mt-2 text-sm whitespace-pre-wrap">{event.content}</p>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1">
                            <button 
                              onClick={() => handleEditEvent(event)}
                              className="text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                              title="Editar evento"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteEvent(event.id)}
                              className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                              title="Excluir evento"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className={`flex items-center gap-1 px-2 py-1 rounded-full
                          ${event.type === AnnouncementType.CULT ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' : 
                            event.type === AnnouncementType.LECTURE ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
                            event.type === AnnouncementType.OTHER ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' :
                            'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}
                        `}>
                          <Clock className="w-3 h-3" /> {event.type}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Nenhum evento agendado para este dia.
                  </div>
                )}
              </div>

              {/* Add Event Form (Admin Only) */}
              {isAdmin && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800">
                  {!showAddEventForm ? (
                    <button 
                      onClick={() => {
                        setShowAddEventForm(true);
                        setEditingEvent(null);
                        setNewEventTitle('');
                        setNewEventContent('');
                        setNewEventType(AnnouncementType.EVENT);
                      }}
                      className="w-full py-2 flex items-center justify-center gap-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors font-medium"
                    >
                      <Plus className="w-4 h-4" /> Adicionar Evento
                    </button>
                  ) : (
                    <div className="space-y-3 animate-in slide-in-from-top-2">
                      <h4 className="font-medium text-slate-700 dark:text-slate-300">
                        {editingEvent ? 'Editar Evento' : 'Novo Evento'}
                      </h4>
                      <input
                        type="text"
                        placeholder="Título do Evento (ex: Culto de Santa Ceia)"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                        value={newEventTitle}
                        onChange={e => setNewEventTitle(e.target.value.toUpperCase())}
                      />
                      <select
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newEventType}
                        onChange={e => setNewEventType(e.target.value as AnnouncementType)}
                      >
                        <option value={AnnouncementType.EVENT}>Evento</option>
                        <option value={AnnouncementType.CULT}>Culto</option>
                        <option value={AnnouncementType.LECTURE}>Palestra</option>
                        <option value={AnnouncementType.OTHER}>Outros</option>
                      </select>
                      <textarea
                        placeholder="Detalhes (Horário, Preletor, etc)"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] uppercase"
                        value={newEventContent}
                        onChange={e => setNewEventContent(e.target.value.toUpperCase())}
                      />
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => {
                            setShowAddEventForm(false);
                            setEditingEvent(null);
                          }}
                          className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700 rounded-lg"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={handleSaveEvent}
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm"
                        >
                          {editingEvent ? 'Salvar Alterações' : 'Salvar Evento'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
