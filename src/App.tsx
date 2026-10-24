/**
 * @file src/App.tsx
 * @description Main application entry point for the VenXR AI Chat Assistant.
 * Integrates the Redux Provider, responsive layout, sidebar, chat viewport,
 * input bar, and interview architecture inspection console.
 */

import React from 'react';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from './store/store';
import { Sidebar } from './components/Sidebar';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { ChatInput } from './components/ChatInput';
import { ArchitectureDrawer } from './components/ArchitectureDrawer';
import { closeMobileSidebar } from './store/uiSlice';

const ChatApp: React.FC = () => {
  const dispatch = useAppDispatch();
  const mobileSidebarOpen = useAppSelector((state) => state.ui.mobileSidebarOpen);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => dispatch(closeMobileSidebar())}
        >
          <div
            className="w-72 h-full bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-slate-50 relative">
        <ChatHeader />
        <MessageList />
        <ChatInput />
      </main>

      {/* Slide-out Architectural Code & Flow Inspector */}
      <ArchitectureDrawer />
    </div>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <ChatApp />
    </Provider>
  );
}
