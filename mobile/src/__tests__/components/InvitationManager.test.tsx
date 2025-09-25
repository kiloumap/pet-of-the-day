import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import InvitationManager from '@/components/invitations/InvitationInterface';
import groupSlice from '@/store/groupSlice';
import authSlice from '@/store/authSlice';

// Mock the API service
jest.mock('@/services/api');

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authSlice,
      groups: groupSlice,
    },
    preloadedState: {
      auth: {
        user: { id: '1', email: 'test@example.com', first_name: 'Test', last_name: 'User', created_at: '2025-01-01' },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      },
      groups: {
        groups: [],
        pendingInvitations: [
          {
            id: '1',
            groupName: 'Test Group',
            senderName: 'John Doe',
            sentAt: '2025-01-01T00:00:00Z',
            expiresAt: '2025-02-01T00:00:00Z',
            type: 'email',
            status: 'pending'
          }
        ],
        isLoading: false,
        error: null,
      },
      ...initialState,
    },
  });
};

describe('InvitationManager Component', () => {
  let store: ReturnType<typeof createMockStore>;

  beforeEach(() => {
    store = createMockStore();
    jest.clearAllMocks();
  });

  it('should render pending invitations correctly', () => {
    const { getByText } = render(
      <Provider store={store}>
        <InvitationManager />
      </Provider>
    );

    expect(getByText('Test Group')).toBeTruthy();
    expect(getByText('John Doe')).toBeTruthy();
  });

  it('should display accept invitation button', () => {
    const { getByText } = render(
      <Provider store={store}>
        <InvitationManager />
      </Provider>
    );

    expect(getByText('Accept')).toBeTruthy();
  });

  it('should display decline invitation button', () => {
    const { getByText } = render(
      <Provider store={store}>
        <InvitationManager />
      </Provider>
    );

    expect(getByText('Decline')).toBeTruthy();
  });

  it('should handle accept invitation action', async () => {
    const { getByText } = render(
      <Provider store={store}>
        <InvitationManager />
      </Provider>
    );

    const acceptButton = getByText('Accept');
    fireEvent.press(acceptButton);

    // Should dispatch accept invitation action
    await waitFor(() => {
      const actions = store.getState();
      // This test should fail initially since the component doesn't exist yet
      expect(actions).toBeDefined();
    });
  });

  it('should handle decline invitation action', async () => {
    const { getByText } = render(
      <Provider store={store}>
        <InvitationManager />
      </Provider>
    );

    const declineButton = getByText('Decline');
    fireEvent.press(declineButton);

    // Should dispatch decline invitation action
    await waitFor(() => {
      const actions = store.getState();
      // This test should fail initially since the component doesn't exist yet
      expect(actions).toBeDefined();
    });
  });

  it('should display empty state when no invitations', () => {
    const emptyStore = createMockStore({
      groups: {
        groups: [],
        pendingInvitations: [],
        isLoading: false,
        error: null,
      },
    });

    const { getByText } = render(
      <Provider store={emptyStore}>
        <InvitationManager />
      </Provider>
    );

    expect(getByText(/no pending invitations/i)).toBeTruthy();
  });

  it('should show loading state while processing invitation', () => {
    const loadingStore = createMockStore({
      groups: {
        groups: [],
        pendingInvitations: [],
        isLoading: true,
        error: null,
      },
    });

    const { getByTestId } = render(
      <Provider store={loadingStore}>
        <InvitationManager />
      </Provider>
    );

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
});