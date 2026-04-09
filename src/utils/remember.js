const LOGIN_KEY = 'everest_remember_login';
const PASS_KEY = 'everest_remember_pass';

export function getRememberedCredentials() {
  return {
    login: localStorage.getItem(LOGIN_KEY) || '',
    pass: localStorage.getItem(PASS_KEY) || ''
  };
}

export function saveRememberedCredentials(login, pass) {
  localStorage.setItem(LOGIN_KEY, login);
  localStorage.setItem(PASS_KEY, pass);
}

export function clearRememberedCredentials() {
  localStorage.removeItem(LOGIN_KEY);
  localStorage.removeItem(PASS_KEY);
}
