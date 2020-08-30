<template>
    <v-dialog :value="value" @input="$emit('input', $event)" max-width="800px" scrollable>
        <v-card>
            <v-card-title class="grey lighten-4 py-4 title">Playlists creation</v-card-title>

            <v-card-text>
                <v-list three-line subheader>
                    <v-subheader>General Info</v-subheader>
                    <v-list-tile avatar>
                        <v-list-tile-content>
                            <v-list-tile-title>Tracks will be exported:</v-list-tile-title>
                            <v-list-tile-sub-title>{{getSelectedTracks.length - getDuplicateTracks.length}}/{{playlist.length}}</v-list-tile-sub-title>
                        </v-list-tile-content>
                    </v-list-tile>
                </v-list>

                <v-divider></v-divider>

                <v-list two-line subheader class="tracks-list">
                    <v-subheader>Duplicated Tracks</v-subheader>
                    <template v-for="item in getDuplicateTracks">
                        <v-list-tile :key="item.deezer.id" avatar>
                            <v-list-tile-avatar>
                                <img :src="item.deezer.album.cover_small">
                            </v-list-tile-avatar>
                            <v-list-tile-content>
                                <v-list-tile-title v-html="item.deezer.title"></v-list-tile-title>
                                <v-list-tile-sub-title v-html="item.deezer.artist.name"></v-list-tile-sub-title>
                            </v-list-tile-content>
                        </v-list-tile>
                    </template>
                </v-list>

                <v-divider></v-divider>

                <v-list subheader class="playlist-list">
                    <v-subheader>Playlist names</v-subheader>
                    <v-alert :value="getExportPlaylists && getExportPlaylists.length > 1"
                             color="info"
                             icon="info"
                             outline
                    >
                        Deezer playlist is limited to 2000 tracks
                    </v-alert>
                    <v-list-tile v-for="(playlist, index) in getExportPlaylists" xs12 :key="index">
                        <v-text-field
                                prepend-icon="playlist_play"
                                placeholder="Playlist Title"
                                :value="playlistsNames[index] || playlist.name"
                                @change="changePlaylistName($event, index)"
                        ></v-text-field>
                    </v-list-tile>
                </v-list>
            </v-card-text>


            <v-card-actions>
                <v-btn flat color="primary" @click="close">Cancel</v-btn>
                <v-spacer></v-spacer>
                <v-btn flat @click="saveMissedTracks" color="orange"><v-icon left>insert_drive_file</v-icon>Save not imported tracks</v-btn>
                <v-btn flat @click="exportToDeezer"><v-icon left>cloud_upload</v-icon>Import to Deezer</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
    import API from '../api/index';
    import {mapGetters, mapState} from "vuex";
    import {downloadObjectAsJson} from "../utils";
    import {eventBus} from "../services/events-manager";

    export default {
        props: {
            value: Boolean
        },
        data: () => ({
            playlistsNames: []
        }),

        computed: {
            ...mapState({
                playlist: state => state.playlist.playlist
            }),
            ...mapGetters([
                'getSelectedTracks',
                'getDuplicateTracks',
                'getExportPlaylists'
            ])
        },

        methods: {
            changePlaylistName(value, index) {
                this.playlistsNames[index] = value;
            },
            saveMissedTracks() {
                const missedTracks = this.playlist.reduce((acc, item) => {
                    // eslint-disable-next-line no-unused-vars
                    const {deezer, selected, ...rest} = item;
                    if (!selected) acc.push(rest);
                    return acc;
                }, []);
                downloadObjectAsJson(missedTracks, 'missed_tracks');
            },
            exportToDeezer() {
                const pl = this.getExportPlaylists.map((item, index) => ({...item, name: this.playlistsNames[index] || item.name}));

                API.exportPlaylistToDeezer(pl)
                    .then(() => {
                        this.close();
                        eventBus.$emit('showSnackbar', `All playlists were successfully added`, 'success');
                    })
                    .catch(() => eventBus.$emit('showSnackbar', `Fail to export tracks`, 'error'));
            },
            close() {
                this.$emit('input', false)
            }
        }
    }
</script>
