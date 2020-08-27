<template>
    <div class="player" v-if="activeTrack">
        <v-avatar tile size="90">
            <img :src="activeTrack.album.cover_medium" alt="album cover">
        </v-avatar>

        <v-container class="player-controls" fluid pa-0>
            <v-layout row align-center>
                <v-flex>
                    <v-btn v-if="isPlaying" icon color="accent" @click="pause">
                        <v-icon>pause</v-icon>
                    </v-btn>
                    <v-btn v-else icon color="accent" @click="onPlayClick">
                        <v-icon>play_arrow</v-icon>
                    </v-btn>
                </v-flex>
                <v-flex>
                    <div class="player-song-data">
                        <a :href="activeTrack.artist.link" target="_blank" rel="noreferrer">
                            {{activeTrack.artist.name}}
                        </a>
                        <span> · </span>
                        <a :href="activeTrack.link" target="_blank" rel="noreferrer">
                            {{activeTrack.title}}
                        </a>
                    </div>
                </v-flex>
                <v-flex sm3>
                    <v-slider
                            class="player-volume-control"
                            v-model="volume"
                            prepend-icon="volume_up"
                            hide-details
                    ></v-slider>
                </v-flex>
            </v-layout>

            <v-layout row>
                <v-flex px-3 shrink align-self-center>
                    <span>{{currentTime}}</span>
                </v-flex>
                <v-flex grow>
                    <v-slider
                            class="progress-slider"
                            hide-details
                            :value="progress"
                            @change="onProgressChange"
                    />
                </v-flex>
                <v-flex px-3 shrink align-self-center>
                    <span>{{duration}}</span>
                </v-flex>
            </v-layout>
        </v-container>
    </div>
</template>

<script>
    import {mapActions, mapState} from "vuex";
    import {secondsToMMSS} from "../utils";

    export default {
        data: () => ({

        }),

        computed: {
            ...mapState({
                activeTrack: state => state.player.activeTrack,
                isPlaying: state => state.player.isPlaying,
                currentTime: state => secondsToMMSS(state.player.currentTime),
                duration: state => secondsToMMSS(state.player.duration),
                progress: state => state.player.progress
            }),
            volume: {
                get() {
                    return this.$store.state.player.volume * 100
                },
                set(value) {
                    this.$store.dispatch('setVolume', value / 100)
                }
            }
        },

        methods: {
            onPlayClick() {
                this.play(this.activeTrack);
            },
            onProgressChange(value) {
                this.seek(value);
            },
            ...mapActions([
                'play',
                'pause',
                'seek'
            ])
        }
    }
</script>

<style lang="scss">
    .player {
        width: 60%;
        min-width: 500px;
        display: flex;
        flex-direction: row;

        .progress-slider {
            margin-top: 0;
            align-items: center;
        }

        .player-volume-control {
            margin: 0;
        }

        .player-song-data > a {
            text-decoration: none;

            &:hover {
                text-decoration: underline;
            }
        }
    }
</style>
