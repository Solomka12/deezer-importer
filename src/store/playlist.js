import eachSeries from 'async/eachSeries';
import lf from 'localforage';

import {getSplitArr, getDuplicates} from '../utils';
import API from '../api/index';

export const PL_SET_INITIAL_PLAYLIST = 'PL_SET_INITIAL_PLAYLIST';
export const PL_SET_STATUS = 'PL_SET_STATUS';
export const PL_INCREMENT_FETCHED_AMOUNT = 'PL_INCREMENT_FETCHED_AMOUNT';
export const PL_REMOVE_TRACK = 'PL_REMOVE_TRACK';
export const PL_UPDATE_TRACK = 'PL_UPDATE_TRACK';
export const PL_TOGGLE_SELECTION = 'PL_TOGGLE_SELECTION';

const state = {
    plStatus: 'none',
    fetchedAmount: 0,
    playlist: []
};

const getters = {
    getSelectedTracks: state => state.playlist.filter(track => track.selected && track.deezer && track.deezer.id),
    getDeezerTrackIds: state => state.playlist.reduce((acc, { deezer }) => deezer && deezer.id ? [...acc, deezer.id] : acc, []),
    getDuplicateTracks: (state, getters) =>
    getDuplicates(getters.getSelectedTracks.map(t => t.deezer.id))
        .map(id => state.playlist.find(track => track.deezer && track.deezer.id === id)),
    getExportPlaylists: (state, getters) => {
        const PLAYLIST_SONGS_LIMIT = 2000;
        const properTracks = Array.from(new Set(getters.getSelectedTracks.map(t => t.deezer.id))); // Removing duplicated track ids
        const splitedArr = getSplitArr(properTracks, PLAYLIST_SONGS_LIMIT);
        return splitedArr.map((item, i) => ({
            name: 'Deezer Playlist Importer ' + (i + 1),
            songs: item.join()
        }));
    }
};

const actions = {
    fetchAllPlaylist({state, commit}) {
        commit(PL_SET_STATUS, 'fetching');
        const newPl = JSON.parse(JSON.stringify(state.playlist));
        eachSeries(newPl, async (track, callback) => {
            try {
                track.deezer = await API.getFirstFoundDeezerTrack(track)
            } catch(err) {
                console.error(err)  // TODO (07.04.2019): add error alert
            } finally {
                commit(PL_INCREMENT_FETCHED_AMOUNT);
                callback();
            }
        }, err => {
            if (err) console.error(err);
            else console.log('All tracks have been processed successfully');
            commit(PL_SET_INITIAL_PLAYLIST, newPl);
            commit(PL_SET_STATUS, 'fetched');
            // commit('saveCurrentPl');
            lf.setItem('playlistData', state.playlist).catch(err => {
                console.log('DB save error:', err);
            });
        });
    },
    setInitialPlaylist({commit}, plData) {
        commit(PL_SET_INITIAL_PLAYLIST, plData);
    },
    setPlaylistStatus({commit}, status) {
        commit(PL_SET_STATUS, status);
    },
    incrementFetchedAmount({commit}) {
        commit(PL_INCREMENT_FETCHED_AMOUNT);
    },
    removePlaylistTrack({commit}, payload) {
        commit(PL_REMOVE_TRACK, payload);
    },
    updatePlaylistTrack({commit}, payload) {
        commit(PL_UPDATE_TRACK, payload);
    },
    tooglePlaylistSelection({commit}) {
        commit(PL_TOGGLE_SELECTION);
    }
};

const mutations = {
    [PL_SET_INITIAL_PLAYLIST](state, payload) {
        console.log(payload);
        state.playlist = payload;
    },
    [PL_SET_STATUS](state, payload) {
        state.plStatus = payload
    },
    [PL_INCREMENT_FETCHED_AMOUNT](state) {
        state.fetchedAmount += 1;
    },
    [PL_REMOVE_TRACK](state, payload) {
        const newPl = [...state.playlist];
        newPl.splice(payload.index, 1);
        state.playlist = newPl;
        lf.setItem('playlistData', newPl)
    },
    [PL_UPDATE_TRACK](state, payload) {
        const newPl = [...state.playlist];
        newPl[payload.index] = payload.track;
        state.playlist = newPl;
        lf.setItem('playlistData', newPl)
    },
    [PL_TOGGLE_SELECTION](state) {
        const newPl = [...state.playlist];
        const selected = state.playlist.filter(track => track.selected);

        if (selected.length) state.playlist = newPl.map(t => ({ ...t, selected: false }));
        else state.playlist = newPl.map(t => ({ ...t, selected: Boolean(t.deezer && t.deezer.id) }));
    }
};

export default {
    state,
    getters,
    actions,
    mutations,
};