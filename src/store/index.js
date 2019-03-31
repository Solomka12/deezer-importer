import Vue from 'vue';
import Vuex from 'vuex';

import {getSplitArr, getDuplicates} from "../utils";

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        playlist: null
    },

    getters: {
        getDeezerTrackIds: state => state.playlist.filter(item => item.deezer).map(item => item.deezer.id),
        getDuplicateTracks: (state, getters) => getDuplicates(getters.getDeezerTrackIds).map(id => state.playlist.find(track => track.deezer && track.deezer.id === id)),
        getImportPlaylists: (state, getters) => {
            const playlistSongsLimit = 2000;
            const properTracks = Array.from(new Set(getters.getDeezerTrackIds)); // Removing duplicated track ids
            const splitedArr = getSplitArr(properTracks, playlistSongsLimit);
            return splitedArr.map((item, i) => ({
                name: 'Deezer Importer Playlist-' + (i + 1),
                songs: item.join()
            }));
        }
    },

    mutations: {
        setPlaylist(state, payload) {
            state.playlist = payload;
        }
        /*increment(state) {
            state.count++;
        }*/
    },

    actions: {
        /*increment(context) {
            context.commit('increment');
        }*/
    }
})