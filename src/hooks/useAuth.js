import { create } from 'zustand';

import { createSelectors } from '../core/utils';
import {getToken, removeToken, setToken, setUser} from './utils';


const _useAuth = create((set, get) => ({
  status: 'signOut',
  token: null,
  signIn: (token) => {
    setToken(token);
    set({ status: 'signIn', token });
  },
  signOut: () => {
    removeToken();
    set({ status: 'signOut', token: null });
  },
  hydrate: () => {
    try {
      const userToken = getToken();
      if (userToken !== null) {
        get().signIn(userToken);
      } else {
        get().signOut();
      }
    } catch (e) {
      // catch error here
      // Maybe sign_out user!
    }
  },
}));


export const useAuth = createSelectors(_useAuth);

export const signOut = () => _useAuth.getState().signOut();
export const signIn = (token) => _useAuth.getState().signIn(token);
export const hydrateAuth = () => _useAuth.getState().hydrate();