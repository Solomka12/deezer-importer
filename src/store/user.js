// import store from './index';
// import {PLAYER_TYPES} from "../constants/constants";

export const USER_SET_INFO = 'USER_SET_INFO';
export const USER_LOGOUT = 'USER_LOGOUT';

const state = {
    userInfo: null,
};

const getters = {
    isLoggedIn: state => Boolean(state.userInfo)
};

const actions = {
    login({commit}) {
        if (!window.DZ) return;

        window.DZ.login(response => {
            if (!response.status) return;

            if (response.authResponse) {
                window.DZ.api('/user/me', response => {
                    commit(USER_SET_INFO, response);
                });
                // store.dispatch('setPlayerType', PLAYER_TYPES.DEEZER);
            } else {
                alert('User cancelled login or did not fully authorize.');
            }
        }, { perms: 'basic_access,manage_library' });
    },
    logout({ commit }) {
        if (window.DZ) window.DZ.logout();

        commit(USER_LOGOUT);
        // store.dispatch('setPlayerType', PLAYER_TYPES.AUDIO);
    },
    setUser({ commit }, userData) {
        commit(USER_SET_INFO, userData);
    },
};

const mutations = {
    [USER_SET_INFO](state, userInfo) {
        state.userInfo = userInfo;
    },
    [USER_LOGOUT](state) {
        state.userInfo = null;
    },
};

export default {
    state,
    getters,
    actions,
    mutations,
};