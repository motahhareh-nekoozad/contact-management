import React, { useState, useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useInfiniteMessages, useUpdateMessage } from '../hooks/useMessage';
import type { Message, Priority, Status } from '../types';
import { NoteModal } from './NoteModal';

export const KanbanBoard = () => {
  const [activeDropCol, setActiveDropCol] = useState<Status | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dropIndicator, setDropIndicator] = useState<{ cardId: string | number; position: 'top' | 'bottom' } | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string | number, boolean>>({});
  
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [spamTargetMessage, setSpamTargetMessage] = useState<Message | null>(null);

  const [activeMobileCol, setActiveMobileCol] = useState<Status | null>('NEW');

  const newQuery = useInfiniteMessages('NEW', true);
  const progressQuery = useInfiniteMessages('IN_PROGRESS', true);
  const resolvedQuery = useInfiniteMessages('RESOLVED', true);
  const updateMutation = useUpdateMessage();

  const getColMessages = (query: any): Message[] => {
    return query.data?.pages.flatMap((page: any) => page.items || []) || [];
  };

  const messagesNew = getColMessages(newQuery);
  const messagesProgress = getColMessages(progressQuery);
  const messagesResolved = getColMessages(resolvedQuery);

  const stats = {
    total: messagesNew.length + messagesProgress.length + messagesResolved.length,
    new: messagesNew.length,
    high: [...messagesNew, ...messagesProgress, ...messagesResolved].filter((m) => m?.priority === 'HIGH').length,
  };

  const columnMapping: Record<Status, { messages: Message[]; query: any }> = {
    NEW: { messages: messagesNew, query: newQuery },
    IN_PROGRESS: { messages: messagesProgress, query: progressQuery },
    RESOLVED: { messages: messagesResolved, query: resolvedQuery },
  };

  const columns: { id: Status; label: string; text: string; activeBorder: string }[] = [
    { id: 'NEW', label: 'Inbox', text: 'text-brand-500', activeBorder: 'border-brand-500/30 bg-brand-500/5' },
    { id: 'IN_PROGRESS', label: 'Under Review', text: 'text-amber-500', activeBorder: 'border-amber-500/30 bg-amber-500/5' },
    { id: 'RESOLVED', label: 'Resolved', text: 'text-emerald-500', activeBorder: 'border-emerald-500/30 bg-emerald-500/5' },
  ];

  const toggleExpand = (id: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleDragStart = (e: React.DragEvent, id: string | number) => {
    e.dataTransfer.setData('messageId', id.toString());
    setIsDragging(true);
    const target = e.currentTarget as HTMLElement;
    gsap.to(target, { scale: 0.96, rotate: -2, opacity: 0.5, duration: 0.15 });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    setActiveDropCol(null);
    setDropIndicator(null);
    const target = e.currentTarget as HTMLElement;
    gsap.to(target, { scale: 1, rotate: 0, opacity: 1, duration: 0.2, ease: 'power2.out' });
  };

  const handleDragOverColumn = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    if (activeDropCol !== status) {
      setActiveDropCol(status);
    }
  };

  const handleCardDragOver = (e: React.DragEvent, cardId: string | number) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    const position = relativeY < rect.height / 2 ? 'top' : 'bottom';
    setDropIndicator({ cardId, position });
  };

  const handleDrop = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    const messageId = e.dataTransfer.getData('messageId');
    setActiveDropCol(null);
    setIsDragging(false);
    setDropIndicator(null);

    if (messageId) {
      const parsedId = isNaN(Number(messageId)) ? messageId : Number(messageId);
      updateMutation.mutate({ id: parsedId, status });
      
      requestAnimationFrame(() => {
        const element = document.getElementById(`msg-${messageId}`);
        if (element) {
          gsap.fromTo(element, 
            { scale: 0.9, y: 15, opacity: 0 }, 
            { scale: 1, y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.5)' }
          );
        }
      });
    }
  };

  const cyclePriority = (id: string | number, current: Priority, event: React.MouseEvent) => {
    event.stopPropagation();
    const nextPriorityMap: Record<Priority, Priority> = {
      LOW: 'MEDIUM',
      MEDIUM: 'HIGH',
      HIGH: 'LOW',
    };
    const nextPriority = nextPriorityMap[current];
    const badge = event.currentTarget as HTMLElement;
    gsap.fromTo(badge, { scale: 0.85 }, { scale: 1, duration: 0.2, ease: 'back.out(1.5)' });
    updateMutation.mutate({ id, priority: nextPriority });
  };

  const handleSaveNote = (note: string) => {
    if (selectedMessage) {
      updateMutation.mutate({ id: selectedMessage.id, internal_notes: note });
    }
  };

  const handleConfirmSpam = () => {
    if (spamTargetMessage) {
      updateMutation.mutate({ id: spamTargetMessage.id, is_spam: true });
      setSpamTargetMessage(null);
    }
  };

  const getPriorityBadgeClass = (priority: Priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20';
      case 'MEDIUM':
        return 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20';
      case 'LOW':
        return 'bg-slate-500/10 dark:bg-slate-500/20 text-slate-500 border border-slate-500/20 hover:bg-slate-500/20';
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fa-IR') + ' ' + date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col gap-6">
      <style>{`
        @keyframes heartFill {
          0% {
            clip-path: inset(100% 0 0 0);
          }
          50% {
            clip-path: inset(0 0 0 0);
          }
          100% {
            clip-path: inset(100% 0 0 0);
          }
        }
        .animate-heart-fill {
          animation: heartFill 1.8s ease-in-out infinite;
        }
      `}</style>

      {/* Cards Stat Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 p-4.5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mb-1 tracking-wider uppercase">Total Messages</p>
            <h4 className="text-xl font-black">{stats.total}</h4>
          </div>
          <div className="p-2.5 bg-brand-500/10 text-brand-500 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5.5 h-5.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5H4.5a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 p-4.5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mb-1 tracking-wider uppercase">Inbox (Unread)</p>
            <h4 className="text-xl font-black text-brand-500">{stats.new}</h4>
          </div>
          <div className="p-2.5 bg-brand-500/10 text-brand-500 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5.5 h-5.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-850 p-4.5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mb-1 tracking-wider uppercase">High Priority</p>
            <h4 className="text-xl font-black text-rose-500">{stats.high}</h4>
          </div>
          <div className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5.5 h-5.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v13.5m-7.5-11.25S9 3 12 3s7.5 2.25 7.5 2.25v7.5s-4.5-2.25-7.5-2.25-7.5 2.25-7.5 2.25V5.25Z" />
            </svg>
          </div>
        </div>
      </section>

      {/* Kanban Board columns */}
      <div dir="ltr" className="flex flex-col md:grid md:grid-cols-3 gap-4 md:gap-6 select-none md:h-[calc(100vh-290px)] md:min-h-[480px]">
        {columns.map((column) => {
          const { messages: colMessages, query } = columnMapping[column.id];
          const isCurrentDropZone = activeDropCol === column.id;
          const isMobileExpanded = activeMobileCol === column.id;

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOverColumn(e, column.id)}
              onDragLeave={() => setActiveDropCol(null)}
              onDrop={(e) => handleDrop(e, column.id)}
              className={`flex flex-col rounded-2xl border transition-all duration-350 ease-out overflow-hidden p-0 md:p-4 h-auto md:h-full ${
                isCurrentDropZone 
                  ? `${column.activeBorder} shadow-lg shadow-brand-500/5 scale-[1.005]` 
                  : 'border-zinc-200/60 dark:border-zinc-900 bg-white/40 dark:bg-zinc-950/20'
              }`}
            >
              <div 
                onClick={() => {
                  if (window.innerWidth < 768) {
                    setActiveMobileCol(isMobileExpanded ? null : column.id);
                  }
                }}
                className={`flex justify-between items-center p-4 md:p-0 md:mb-4 md:pb-2 md:border-b md:border-zinc-200/30 dark:md:border-zinc-900 cursor-pointer md:cursor-default select-none ${
                  isMobileExpanded ? 'border-b border-zinc-100 dark:border-zinc-900 md:border-b-0' : ''
                }`}
              >
                <h2 className={`font-extrabold text-xs tracking-wider flex items-center gap-2 ${column.text} uppercase`}>
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {column.label}
                </h2>
                
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800 text-zinc-500">
                    {colMessages.length}
                  </span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    strokeWidth={2.5} 
                    stroke="currentColor" 
                    className={`w-3.5 h-3.5 md:hidden transition-transform duration-300 text-zinc-400 ${isMobileExpanded ? 'rotate-180' : 'rotate-0'}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>

              <div className={`flex-grow min-h-0 overflow-y-auto pr-1 flex flex-col gap-3 custom-scrollbar transition-all duration-350 ease-in-out ${
                isMobileExpanded 
                  ? 'max-h-[60vh] opacity-100 p-4 md:p-0 md:max-h-none md:min-h-0' 
                  : 'max-h-0 opacity-0 md:max-h-none md:opacity-100 md:min-h-0 pointer-events-none md:pointer-events-auto'
              }`}>
                {query.isLoading ? (
                  <div className="py-8 md:flex-grow flex items-center justify-center text-xs text-zinc-400">
                    <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent animate-spin rounded-full mr-2" />
                    Loading...
                  </div>
                ) : colMessages.length === 0 ? (
                  <div className="py-8 md:flex-grow flex flex-col items-center justify-center border-2 border-dashed border-zinc-200/50 dark:border-zinc-800/60 rounded-xl p-4 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                    No messages here
                  </div>
                ) : (
                  colMessages.map((message) => {
                    if (!message?.id) return null;
                    const showIndicatorTop = dropIndicator?.cardId === message.id && dropIndicator?.position === 'top';
                    const showIndicatorBottom = dropIndicator?.cardId === message.id && dropIndicator?.position === 'bottom';
                    const isExpanded = !!expandedCards[message.id];

                    return (
                      <div 
                        key={message.id}
                        onDragOver={(e) => handleCardDragOver(e, message.id)}
                      >
                        {showIndicatorTop && (
                          <div className="h-1 bg-brand-500/80 rounded-full my-1.5 shadow-[0_0_8px_#f43f5e] transition-all animate-pulse duration-150" />
                        )}

                        <div
                          id={`msg-${message.id}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, message.id)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => toggleExpand(message.id, e)}
                          className={`group bg-white dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 p-4 rounded-xl shadow-sm hover:shadow-md dark:hover:shadow-brand-500/5 hover:border-brand-500/20 dark:hover:border-brand-500/20 cursor-grab active:cursor-grabbing relative transition-all duration-200 ${
                            isDragging ? 'opacity-85 scale-[0.99]' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex flex-col truncate">
                              <h3 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-100 group-hover:text-brand-500 dark:group-hover:text-brand-400 transition-colors">
                                {message?.name}
                              </h3>
                              <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                                {formatDate(message?.created_at)}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => cyclePriority(message.id, message?.priority || 'LOW', e)}
                                className={`text-[9px] font-black px-2.5 py-0.5 rounded-full tracking-wider transition-all duration-200 ${getPriorityBadgeClass(message?.priority || 'LOW')}`}
                              >
                                {message?.priority || 'LOW'}
                              </button>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSpamTargetMessage(message);
                                }}
                                title="Spam"
                                className="p-1 rounded-md hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 transition-colors"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              </button>

                              <button
                                onClick={(e) => toggleExpand(message.id, e)}
                                className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition-colors"
                              >
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  strokeWidth={2.5} 
                                  stroke="currentColor" 
                                  className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Expanded Content */}
                          <div 
                            className={`transition-all duration-350 ease-in-out overflow-hidden ${
                              isExpanded ? 'max-h-[500px] opacity-100 mt-3' : 'max-h-0 opacity-0'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex flex-col gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 mb-2.5 border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
                              <span className="truncate flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                {message?.contact_info || 'No Contact Info'}
                              </span>
                            </div>

                            <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-3 mb-3 leading-relaxed">
                              {message?.description}
                            </p>
                            
                            <div className="flex md:hidden flex-col gap-1.5 mb-3">
                              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">Move to:</span>
                              <div className="flex gap-1.5">
                                {columns
                                  .filter((col) => col.id !== message.status)
                                  .map((col) => (
                                    <button
                                      key={col.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateMutation.mutate({ id: message.id, status: col.id });
                                      }}
                                      className="flex-1 py-1 px-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-brand-500/10 text-zinc-650 dark:text-zinc-350 text-[10px] font-extrabold rounded-md border border-zinc-200/40 dark:border-zinc-700/50 transition-colors"
                                    >
                                      {col.label}
                                    </button>
                                  ))}
                              </div>
                            </div>

                            {message?.internal_notes && (
                              <div className="mb-3.5 p-2 bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/10 rounded-lg text-[10.5px] text-brand-600 dark:text-brand-300 flex items-start gap-1.5">
                                <span className="font-bold shrink-0">Internal Note:</span>
                                <span className="line-clamp-2 leading-relaxed">{message.internal_notes}</span>
                              </div>
                            )}

                            <button
                              onClick={() => setSelectedMessage(message)}
                              className="w-full py-1.5 px-3 border border-zinc-200 dark:border-zinc-800 hover:border-brand-500/40 hover:bg-brand-500/5 hover:text-brand-500 dark:text-zinc-300 dark:hover:text-brand-400 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                              </svg>
                              {message?.internal_notes ? 'Edit Note' : 'Add Note'}
                            </button>
                          </div>
                        </div>

                        {showIndicatorBottom && (
                          <div className="h-1 bg-brand-500/80 rounded-full my-1.5 shadow-[0_0_8px_#f43f5e] transition-all animate-pulse duration-150" />
                        )}
                      </div>
                    );
                  })
                )}

                <ColumnSentinel 
                  onIntersect={query.fetchNextPage} 
                  hasNextPage={query.hasNextPage} 
                  isFetching={query.isFetchingNextPage}
                />
                
                {query.isFetchingNextPage && (
                  <div className="py-2.5 flex items-center justify-center">
                    <div className="relative w-4.5 h-4.5">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4.5 h-4.5 text-rose-300 dark:text-rose-900/50 absolute inset-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                      </svg>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4.5 h-4.5 text-rose-500 absolute inset-0 animate-heart-fill">
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3c1.54 0 2.902.65 3.857 1.75C12.493 3.65 13.855 3 15.312 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <NoteModal
        message={selectedMessage}
        onClose={() => setSelectedMessage(null)}
        onSave={(variables) => handleSaveNote(variables.internal_notes)}
      />

      {spamTargetMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm p-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-black text-sm text-zinc-900 dark:text-zinc-100 mb-2">Mark as Spam?</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5 leading-relaxed">
              Are you sure you want to mark <span className="font-bold text-zinc-700 dark:text-zinc-200">"{spamTargetMessage.name}"</span> as spam? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2 text-xs font-bold">
              <button
                onClick={() => setSpamTargetMessage(null)}
                className="px-3.5 py-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSpam}
                className="px-4 py-2 bg-rose-500 text-white hover:bg-rose-600 rounded-xl shadow-sm transition-colors"
              >
                Confirm Spam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ColumnSentinel = ({ 
  onIntersect, 
  hasNextPage, 
  isFetching 
}: { 
  onIntersect: () => void; 
  hasNextPage: boolean; 
  isFetching: boolean; 
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasNextPage || isFetching) return;
    
    const scrollContainer = sentinelRef.current?.parentElement;
    if (!scrollContainer) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        onIntersect();
      }
    }, { 
      root: scrollContainer, 
      rootMargin: '0px 0px 100px 0px', 
      threshold: 0 
    });

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }
    
    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
      observer.disconnect();
    };
  }, [onIntersect, hasNextPage, isFetching]);

  return <div ref={sentinelRef} className="h-2 w-full shrink-0" />;
};