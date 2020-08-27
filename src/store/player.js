import * as deezer from '../services/deezer.player';
import * as player from '../services/audio.player';
import {PLAYER_TYPES} from "../constants/constants";

import {eventBus} from '../services/events-manager';

export const PLAYER_PLAY = 'PLAY';
export const PLAYER_PAUSE = 'PAUSE';
export const PLAYER_START_PLAY = 'START_PLAY';
export const PLAYER_AUDIO_STOP = 'AUDIO_STOP';
export const PLAYER_UPDATE = 'UPDATE';
export const PLAYER_SET_VOLUME = 'SET_VOLUME';
export const PLAYER_SET_ACTIVE_TRACK = 'SET_ACTIVE_TRACK';
export const PLAYER_RESET_TRACK_STATE = 'RESET_TRACK_STATE';
export const PLAYER_SET_AUDIO_LOADING = 'SET_AUDIO_LOADING';
export const PLAYER_SET_TRACK_ERROR = 'SET_TRACK_ERROR';
export const PLAYER_SET_PLAYER_TYPE = 'SET_PLAYER_TYPE';
export const PLAYER_SET_AUDIO_READY_STATE = 'SET_AUDIO_READY_STATE';

const state = {
    activeTrack: null,
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    progress: 0,
    volume: 0.5,
    isReady: false,
    playerType: PLAYER_TYPES.AUDIO
};

let playService = player;

const actions = {
    audioUpdate({commit}, payload) {
        commit(PLAYER_UPDATE, payload);
    },
    play({commit, dispatch}, track) {
        commit(PLAYER_START_PLAY);
        commit(PLAYER_PLAY, track);

        if (track.hasError) dispatch('audioError');
        else playService.play(track);
    },
    pause({commit}) {
        playService.pause();
        commit(PLAYER_PAUSE);
    },
    audioEnd({commit}) {
        commit(PLAYER_AUDIO_STOP);
    },
    audioError({state, dispatch}) {
        eventBus.$emit(
            'showSnackbar',
            `Error on loading track: ${state.activeTrack.artist.name} - ${state.activeTrack.title}`
        );
        dispatch('audioEnd');
        dispatch('setTrackError');
    },
    setVolume({commit}, volume) {
        playService.setVolume(volume);
        commit(PLAYER_SET_VOLUME, volume);
    },
    seek(state, progress) {
        playService.seek(progress);
    },
    setTrackError({commit}) {
        commit(PLAYER_SET_TRACK_ERROR);
    },
    setAudioLoading({commit}, payload) {
        commit(PLAYER_SET_AUDIO_LOADING, payload);
    },
    setPlayerType({commit}, playerType) {
        playService && playService.pause();
        if (playService.destroy) {
            playService.destroy();
        }
        playService = playerType === PLAYER_TYPES.DEEZER ? deezer : player;
        commit(PLAYER_SET_AUDIO_READY_STATE, true);
    },
};

const mutations = {
    [PLAYER_PLAY](state, payload) {
        state.activeTrack = payload;
        state.isPlaying = true;
    },
    [PLAYER_PAUSE](state) {
        state.isPlaying = false;
    },
    [PLAYER_START_PLAY](state) {
        state.progress = 0;
        state.currentTime = 0;
    },
    [PLAYER_SET_ACTIVE_TRACK](state, payload) {
        state.activeTrack = payload;
    },
    [PLAYER_AUDIO_STOP](state) {
        state.isPlaying = false;
        state.progress = 0;
        state.currentTime = 0;
    },
    [PLAYER_SET_VOLUME](state, payload) {
        state.volume = payload;
    },
    [PLAYER_UPDATE](state, payload) {
        const {currentTime, duration, progress} = payload;
        state.currentTime = currentTime;
        state.duration = duration;
        state.progress = progress;
    },
    [PLAYER_RESET_TRACK_STATE](state) {
        state.activeTrack = null;
    },
    [PLAYER_SET_AUDIO_LOADING](state, payload) {
        state.isLoading = payload;
    },
    [PLAYER_SET_TRACK_ERROR](state) {
        state.activeTrack.hasError = true;
    },
    [PLAYER_SET_PLAYER_TYPE](state, payload) {
        state.playerType = payload;
    },
    [PLAYER_SET_AUDIO_READY_STATE](state, payload) {
        state.isAudioReady = payload;
    }
};

export default {
    state,
    actions,
    mutations
};