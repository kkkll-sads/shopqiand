import {
  STORAGE_KEY_PASSWORD,
  STORAGE_KEY_PHONE,
  STORAGE_KEY_REMEMBER,
} from './constants';

export interface RememberedCredentials {
  phone: string;
  password: string;
  rememberMe: boolean;
}

export const loadRememberedCredentials = (): RememberedCredentials => {
  const rememberMe = localStorage.getItem(STORAGE_KEY_REMEMBER) === 'true';
  if (!rememberMe) {
    return { phone: '', password: '', rememberMe: false };
  }

  return {
    phone: localStorage.getItem(STORAGE_KEY_PHONE) || '',
    password: localStorage.getItem(STORAGE_KEY_PASSWORD) || '',
    rememberMe: true,
  };
};

export const saveRememberedCredentials = (phone: string, password: string) => {
  localStorage.setItem(STORAGE_KEY_PHONE, phone);
  localStorage.setItem(STORAGE_KEY_PASSWORD, password);
  localStorage.setItem(STORAGE_KEY_REMEMBER, 'true');
};

export const clearRememberedCredentials = () => {
  localStorage.removeItem(STORAGE_KEY_PHONE);
  localStorage.removeItem(STORAGE_KEY_PASSWORD);
  localStorage.removeItem(STORAGE_KEY_REMEMBER);
};
