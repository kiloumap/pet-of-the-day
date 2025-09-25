import { AuthState } from '../store/authSlice';
import { PetState } from '../store/petSlice';
import { GroupState } from '../store/groupSlice';

export interface RootState {
  auth: AuthState;
  pets: PetState;
  groups: GroupState;
}

export interface AsyncThunkConfig {
  state: RootState;
  rejectValue: string;
}

// Redux toolkit types
export type AppDispatch = any; // Will be properly typed when store is configured
export type AppSelector<T> = (state: RootState) => T;