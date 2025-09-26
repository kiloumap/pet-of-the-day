import { API_CONFIG } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PetRanking, PetOfTheDayWinner } from '../types/behavior';

// WebSocket message types that match backend implementation
export const WEBSOCKET_MESSAGE_TYPES = {
  RANKINGS_UPDATE: 'rankings_update',
  PET_OF_THE_DAY_UPDATE: 'pet_of_the_day_update',
  ERROR: 'error',
  PING: 'ping',
  PONG: 'pong',
} as const;

export interface WebSocketMessage {
  type: string;
  data?: any;
  error?: string;
  timestamp: string;
}

export interface RankingsUpdateData {
  rankings: PetRanking[];
  groupId: string;
  date: string;
}

export interface PetOfTheDayUpdateData {
  winner: PetOfTheDayWinner;
  groupId: string;
  date: string;
}

type MessageHandler = (data: any) => void;
type ErrorHandler = (error: string) => void;
type ConnectionHandler = () => void;

interface WebSocketServiceOptions {
  onRankingsUpdate?: MessageHandler;
  onPetOfTheDayUpdate?: MessageHandler;
  onError?: ErrorHandler;
  onConnect?: ConnectionHandler;
  onDisconnect?: ConnectionHandler;
  autoReconnect?: boolean;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private groupId: string | null = null;
  private isConnecting = false;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private autoReconnect = true;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  private handlers: {
    onRankingsUpdate?: MessageHandler;
    onPetOfTheDayUpdate?: MessageHandler;
    onError?: ErrorHandler;
    onConnect?: ConnectionHandler;
    onDisconnect?: ConnectionHandler;
  } = {};

  /**
   * Initialize WebSocket connection for a specific group
   */
  async connect(groupId: string, options: WebSocketServiceOptions = {}): Promise<void> {
    if (this.isConnecting || (this.isConnected && this.groupId === groupId)) {
      return;
    }

    this.groupId = groupId;
    this.handlers = {
      onRankingsUpdate: options.onRankingsUpdate,
      onPetOfTheDayUpdate: options.onPetOfTheDayUpdate,
      onError: options.onError,
      onConnect: options.onConnect,
      onDisconnect: options.onDisconnect,
    };

    if (options.autoReconnect !== undefined) {
      this.autoReconnect = options.autoReconnect;
    }
    if (options.maxReconnectAttempts !== undefined) {
      this.maxReconnectAttempts = options.maxReconnectAttempts;
    }
    if (options.reconnectInterval !== undefined) {
      this.reconnectInterval = options.reconnectInterval;
    }

    await this.createConnection();
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.autoReconnect = false;
    this.cleanup();
  }

  /**
   * Check if WebSocket is connected
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current group ID
   */
  getCurrentGroupId(): string | null {
    return this.groupId;
  }

  private async createConnection(): Promise<void> {
    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      // Get authentication token
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Create WebSocket URL
      const wsUrl = API_CONFIG.BASE_URL
        .replace('http://', 'ws://')
        .replace('https://', 'wss://');
      const url = `${wsUrl}/ws/groups/${this.groupId}/rankings?token=${token}`;

      // Create WebSocket connection
      this.socket = new WebSocket(url);
      this.setupEventHandlers();
    } catch (error) {
      this.isConnecting = false;
      this.handleError(`Failed to create WebSocket connection: ${error}`);

      if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) {
      return;
    }

    this.socket.onopen = () => {
      this.isConnecting = false;
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Start ping interval to keep connection alive
      this.startPingInterval();

      console.log('WebSocket connected for group:', this.groupId);
      this.handlers.onConnect?.();
    };

    this.socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
        this.handleError('Failed to parse WebSocket message');
      }
    };

    this.socket.onclose = (event) => {
      this.isConnected = false;
      this.isConnecting = false;
      this.stopPingInterval();

      console.log('WebSocket disconnected:', event.code, event.reason);
      this.handlers.onDisconnect?.();

      // Attempt reconnection if enabled and not a clean close
      if (this.autoReconnect && event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect();
      }
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleError('WebSocket connection error');
    };
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case WEBSOCKET_MESSAGE_TYPES.RANKINGS_UPDATE:
        if (message.data) {
          this.handlers.onRankingsUpdate?.(message.data);
        }
        break;

      case WEBSOCKET_MESSAGE_TYPES.PET_OF_THE_DAY_UPDATE:
        if (message.data) {
          this.handlers.onPetOfTheDayUpdate?.(message.data);
        }
        break;

      case WEBSOCKET_MESSAGE_TYPES.ERROR:
        if (message.error) {
          this.handleError(message.error);
        }
        break;

      case WEBSOCKET_MESSAGE_TYPES.PONG:
        // Pong received, connection is alive
        break;

      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  }

  private handleError(error: string): void {
    console.error('WebSocket service error:', error);
    this.handlers.onError?.(error);
  }

  private startPingInterval(): void {
    this.stopPingInterval();

    // Send ping every 30 seconds to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.sendMessage(WEBSOCKET_MESSAGE_TYPES.PING, null);
      }
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private sendMessage(type: string, data: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        data,
        timestamp: new Date().toISOString(),
      };
      this.socket.send(JSON.stringify(message));
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1);

    console.log(`Scheduling WebSocket reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);

    this.reconnectTimeout = setTimeout(() => {
      if (this.groupId && this.autoReconnect) {
        this.createConnection();
      }
    }, delay);
  }

  private cleanup(): void {
    this.stopPingInterval();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.onerror = null;

      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close(1000, 'Client disconnect');
      }
      this.socket = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.groupId = null;
    this.reconnectAttempts = 0;
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();
export default webSocketService;