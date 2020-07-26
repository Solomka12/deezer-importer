import store from './index';

export const USER_SET_INFO = 'USER_SET_INFO';
export const USER_LOGOUT = 'USER_LOGOUT';

const DZ = window.DZ;

const state = {
    userInfo: null,
};

const getters = {
    isLoggedIn: state => Boolean(state.userInfo)
};

const actions = {
    login({commit}) {
        if (!DZ) return;

        DZ.login(response => {
            if (!response.status) return;

            if (response.authResponse) {
                DZ.api('/user/me', response => {
                    commit(USER_SET_INFO, response);
                });
                store.dispatch('setPlayerStatus', true);
            } else {
                alert('User cancelled login or did not fully authorize.');
            }
        }, { perms: 'basic_access,manage_library' });
    },
    logout({ commit }) {
        if (DZ) DZ.logout();

        commit(USER_LOGOUT);
        store.dispatch('setPlayerStatus', false);
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