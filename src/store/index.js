import Vue from 'vue';
import Vuex from 'vuex';
import eachSeries from 'async/eachSeries';
import lf from 'localforage';

import {getSplitArr, getDuplicates} from "../utils";
import API from "../api/index";

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        plStatus: 'none',
        fetchedAmount: 0,
        playlist: []
    },

    getters: {
        getSelectedTracks: state => state.playlist.filter(track => track.selected),
        getDeezerTrackIds: state => state.playlist.reduce((acc, { deezer }) => deezer && deezer.id ? [...acc, deezer.id] : acc, []),
        getDuplicateTracks: (state, getters) => getDuplicates(getters.getSelectedTracks.map(t => t.deezer.id)).map(id => state.playlist.find(track => track.deezer && track.deezer.id === id)),
        getExportPlaylists: (state, getters) => {
            const PLAYLIST_SONGS_LIMIT = 2000;
            const properTracks = Array.from(new Set(getters.getSelectedTracks.map(t => t.deezer.id))); // Removing duplicated track ids
            const splitedArr = getSplitArr(properTracks, PLAYLIST_SONGS_LIMIT);
            return splitedArr.map((item, i) => ({
                name: 'Deezer Importer Playlist-' + (i + 1),
                songs: item.join()
            }));
        }
    },

    mutations: {
        setPlaylist(state, payload) {
            state.playlist = payload;
        },
        setPlStatus(state, payload) {
            state.plStatus = payload
        },
        /* saveCurrentPl(state) {
            // localStorage.setItem('playlistData', JSON.stringify(state.playlist));
        }, */
        incrementFetchedAmount(state) {
            state.fetchedAmount += 1;
        },
        removePlaylistTrack(state, payload) {
            const newPl = [...state.playlist];
            newPl.splice(payload.index, 1);
            state.playlist = newPl;
            lf.setItem('playlistData', newPl)
        },
        updatePlaylistTrack(state, payload) {
            const newPl = [...state.playlist];
            newPl[payload.index] = payload.track;
            state.playlist = newPl;
            lf.setItem('playlistData', newPl)
        },
        tooglePlaylistSelection(state) {
            const newPl = [...state.playlist];
            const selected = state.playlist.filter(track => track.selected);

            if (selected.length) state.playlist = newPl.map(t => ({ ...t, selected: false }));
            else state.playlist = newPl.map(t => ({ ...t, selected: Boolean(t.deezer && t.deezer.id) }));
        }
    },

    actions: {
        fetchAllPlaylist({state, commit}) {
            commit('setPlStatus', 'fetching');
            const newPl = JSON.parse(JSON.stringify(state.playlist));
            eachSeries(newPl, async (track, callback) => {
                try { track.deezer = await API.getDeezerTrack(track) }
                catch(err) { console.error(err) } // TODO (07.04.2019): add error alert
                finally {
                    commit('incrementFetchedAmount');
                    callback();
                }
            }, err => {
                if (err) console.error(err);
                else console.log('All tracks have been processed successfully');
                commit('setPlaylist', newPl);
                commit('setPlStatus', 'fetched');
                // commit('saveCurrentPl');
                lf.setItem('playlistData', state.playlist)
                .catch(err => {
                    console.log('DB save error:', err);
                });
            });
        },
    }
})