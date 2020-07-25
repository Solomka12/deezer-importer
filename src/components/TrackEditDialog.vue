<template>
    <v-dialog :value="selectedTrack" max-width="500px" persistent scrollable>
        <v-card>
            <v-card-title>
                <span class="headline">Edit Item</span>
            </v-card-title>

            <v-card-text class="dialog-content">
                <v-container grid-list-md class="dialog-content-controls">
                    <v-layout wrap>
                        <v-flex md12 v-if="separatedQuerySearch">
                            <v-text-field v-model.lazy="artist" @change="findTracks" label="Artist"></v-text-field>
                            <v-text-field v-model.lazy="title" @change="findTracks" label="Title"></v-text-field>
                        </v-flex>
                        <v-flex md12 v-else>
                            <v-text-field v-model.lazy="query" @change="findTracks" label="Search Query"></v-text-field>
                        </v-flex>
                    </v-layout>
                    <v-layout wrap>
                        <v-flex md8>
                            <v-switch dense inset
                                      v-model="separatedQuerySearch"
                                      @change="onQueryModeChange"
                                      label="Search by artist and title"></v-switch>
                        </v-flex>
                        <v-flex md4>
                            <v-checkbox v-model="strictMode" @change="findTracks" label="Strict mode"></v-checkbox>
                        </v-flex>
                    </v-layout>
                </v-container>

                <v-subheader>Found tracks</v-subheader>

                <v-alert :value="!foundTracks.length" color="warning" icon="info" outline>Nothing Found</v-alert>

                <v-list two-line class="dialog-content-tracks-list">
                    <template v-for="(item, index) in foundTracks">
                        <v-divider :key="index"></v-divider>
                        <v-list-tile avatar
                                     :key="item.id"
                                     :class="{blue: deezerTrack && deezerTrack.id === item.id}"
                                     @click="selectDeezerTrack(item)">
                            <v-list-tile-avatar>
                                <img :src="item.album.cover_small">
                            </v-list-tile-avatar>
                            <v-list-tile-content>
                                <v-list-tile-title v-html="item.title"></v-list-tile-title>
                                <v-list-tile-sub-title v-html="item.artist.name"></v-list-tile-sub-title>
                            </v-list-tile-content>
                        </v-list-tile>
                    </template>
                </v-list>
            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" flat @click="cancel">Cancel</v-btn>
                <v-btn flat color="blue darken-1" @click="save" :disabled="isSaveButtonDisabled">Save</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
    import API from '../api/index';

    export default {
        props: {
            selectedTrack: Object
        },
        data: () => ({
            separatedQuerySearch: true,
            strictMode: false,
            foundTracks: [],
            query: '',
            artist: '',
            title: '',
            deezerTrack: null
        }),

        watch: {
            selectedTrack(val) {
                if (val) {
                    this.deezerTrack = val.deezer;
                    this.onQueryModeChange();
                } else {
                    this.close();
                }
            }
        },

        computed: {
            isSaveButtonDisabled() {
                const selectedTrackId = this.selectedTrack && this.selectedTrack.deezer && this.selectedTrack.deezer.id;
                return !this.deezerTrack || selectedTrackId === this.deezerTrack.id;
            }
        },

        methods: {
            findTracks() {
                if (this.separatedQuerySearch) {
                    API.findDeezerTracksByArtistAndTitle({artist: this.artist, title: this.title}, this.strictMode)
                        .then(res => this.foundTracks = res)
                        .catch(console.error);
                } else {
                    API.findDeezerTracks(this.query, this.strictMode)
                        .then(res => this.foundTracks = res)
                        .catch(console.error);
                }
            },

            selectDeezerTrack(track) {
                this.deezerTrack = track;
            },

            close() {
                setTimeout(() => {
                    this.foundTracks = [];
                    this.query = '';
                    this.artist = '';
                    this.title = '';
                    this.deezerTrack = null;
                }, 300)
            },

            save() {
                if (this.deezerTrack) {
                    const newTrack = {deezer: this.deezerTrack};
                    if (this.separatedQuerySearch) {
                        newTrack.artist = this.artist;
                        newTrack.title = this.title;
                    }
                    this.$emit('save', newTrack);
                }
            },

            cancel() {
                this.$emit('cancel');
            },

            onQueryModeChange() {
                const {artist, title} = this.selectedTrack;
                if (this.separatedQuerySearch) {
                    this.artist = artist;
                    this.title = title;
                } else {
                    this.query = `${artist} - ${title}`
                }
                this.findTracks();
            }
        }
    }
</script>

<style lang="scss">
    .dialog-content {
        display: flex;
        flex-direction: column;

        &-controls {
            flex: 0;
            padding: 0 12px;
        }

        &-tracks-list {
            overflow: auto;
            flex-grow: 1;
        }
    }
</style>
