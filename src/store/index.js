import Vue from 'vue';
import Vuex from 'vuex';
import eachSeries from 'async/eachSeries';

import {getSplitArr, getDuplicates} from "../utils";
import {getDeezerTrack} from "../api/index";

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        plStatus: 'none',
        fetchedAmount: 0,
        playlist: null
    },

    getters: {
        getDeezerTrackIds: state => state.playlist.filter(item => item.deezer).map(item => item.deezer.id),
        getDuplicateTracks: (state, getters) => getDuplicates(getters.getDeezerTrackIds).map(id => state.playlist.find(track => track.deezer && track.deezer.id === id)),
        getImportPlaylists: (state, getters) => {
            const PLAYLIST_SONGS_LIMIT = 2000;
            const properTracks = Array.from(new Set(getters.getDeezerTrackIds)); // Removing duplicated track ids
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
        saveCurrentPl(state) {
            localStorage.setItem('playlistData', JSON.stringify(state.playlist));
        },
        incrementFetchedAmount(state) {
            state.fetchedAmount += 1;
        }
    },

    actions: {
        fetchAllPlaylist({state, commit}) {
            commit('setPlStatus', 'fetching');
            const newPl = JSON.parse(JSON.stringify(state.playlist));
            eachSeries(newPl, async (track, callback) => {
                try { track.deezer = await getDeezerTrack(track) }
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
                commit('saveCurrentPl');
            });
        },
    }
})