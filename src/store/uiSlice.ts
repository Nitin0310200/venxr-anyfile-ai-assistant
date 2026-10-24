/**
 * @file src/store/uiSlice.ts
 * @description Redux slice managing client UI presentation states.
 * Controls the interview architecture drawer, active documentation tabs,
 * and mobile navigation drawers.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ArchitectureTab = 'redux' | 'langgraph' | 'django' | 'deliverables' | 'edgecases';

export interface UiState {
  /** Whether the slide-out Architectural Code & Flow Inspector is open */
  isArchitectureDrawerOpen: boolean;
  /** Active tab inside the architecture inspector */
  activeArchitectureTab: ArchitectureTab;
  /** Whether the mobile navigation sidebar is visible */
  mobileSidebarOpen: boolean;
}

const initialState: UiState = {
  isArchitectureDrawerOpen: false,
  activeArchitectureTab: 'redux',
  mobileSidebarOpen: false,
};

/**
 * UI State Slice.
 * Handles pure layout state updates without touching chat business data.
 */
export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    /**
     * Toggles the Architectural Code & Flow Inspector drawer.
     * Used by interviewees to present system architecture to the interviewer.
     */
    toggleArchitectureDrawer: (state) => {
      state.isArchitectureDrawerOpen = !state.isArchitectureDrawerOpen;
    },
    /**
     * Explicitly sets the architecture drawer open/closed.
     */
    setArchitectureDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.isArchitectureDrawerOpen = action.payload;
    },
    /**
     * Switches the active tab inside the architecture drawer.
     */
    setActiveArchitectureTab: (state, action: PayloadAction<ArchitectureTab>) => {
      state.activeArchitectureTab = action.payload;
    },
    /**
     * Toggles the mobile responsive sidebar navigation.
     */
    toggleMobileSidebar: (state) => {
      state.mobileSidebarOpen = !state.mobileSidebarOpen;
    },
    /**
     * Closes the mobile sidebar.
     */
    closeMobileSidebar: (state) => {
      state.mobileSidebarOpen = false;
    },
  },
});

export const {
  toggleArchitectureDrawer,
  setArchitectureDrawerOpen,
  setActiveArchitectureTab,
  toggleMobileSidebar,
  closeMobileSidebar,
} = uiSlice.actions;

export default uiSlice.reducer;
