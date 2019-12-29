<template>
    <v-app>
        <div id="dz-root"></div>
        <v-toolbar app>
            <v-toolbar-title class="headline text-uppercase">
                <span>Deezer</span>
                <span class="font-weight-light"> Playlist Importer</span>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <div v-if="user" class="headline">Hello, {{user.name}}</div>
            <v-btn v-else flat @click="deezerLogIn">
                <span class="mr-2">Connect to Deezer</span>
            </v-btn>
        </v-toolbar>

        <v-content>
            <PlaylistTable v-if="playlist.length" @playTrack="onPlayTrack"/>

            <div v-else style="text-align: center;">
                <PlaylistReader/>
                <v-btn v-if="isInLS" flat @click="loadFromLS"><span class="mr-2">Load from previous session</span></v-btn>
            </div>
        </v-content>

        <v-footer v-if="plStatus !== 'none'" app class="py-2 px-3" height="auto" color="secondary lighten-1">
            <div class="player">
                <v-btn icon color="accent">
                    <v-icon>play_arrow</v-icon>
                </v-btn>
            </div>

            <v-spacer></v-spacer>

            <v-btn v-if="['fetching', 'new'].includes(plStatus)"
                   color="accent"
                   light
                   :loading="plStatus === 'fetching'"
                   @click="fetchAllPlaylist">Fetch From Deezer</v-btn>
            <v-btn v-else light color="accent" @click="exportPlaylist">
                <span>Export Playlist</span>
            </v-btn>

        </v-footer>

        <v-dialog v-model="exportModal" width="800px"> <!--TODO (17.03.2019): Add success & error alerts-->
            <v-card>
                <v-card-title class="grey lighten-4 py-4 title">Playlists creation</v-card-title>

                <v-list three-line subheader>
                    <v-subheader>General Info</v-subheader>
                    <v-list-tile avatar>
                        <v-list-tile-content>
                            <v-list-tile-title>Tracks will be imported:</v-list-tile-title>
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

                <v-container grid-list-sm class="pa-4">
                    <v-layout row wrap>
                        <v-flex v-for="(playlist, index) in getExportPlaylists" xs12 :key="index">
                            <v-text-field
                                    prepend-icon="playlist_play"
                                    placeholder="Playlist Title"
                                    :value="playlistsNames[index] || playlist.name"
                                    @change="changePlaylistName($event, index)"
                            ></v-text-field>
                        </v-flex>
                    </v-layout>
                </v-container>
                <v-card-actions>
                    <v-btn flat color="primary" @click="exportModal = false">Cancel</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn flat @click="saveMissedTracks" color="orange"><v-icon left>insert_drive_file</v-icon>Save not imported tracks</v-btn>
                    <v-btn flat @click="exportToDeezer"><v-icon left>cloud_upload</v-icon>Import to Deezer</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-app>
</template>

<script>
    import { mapState, mapGetters, mapActions, mapMutations } from 'vuex';
    import PlaylistReader from './components/PlaylistReader';
    import PlaylistTable from './components/PlaylistTable';
    import API from './api';

    const DZ = window.DZ;

    export default {
        name: 'App',
        components: {
            PlaylistReader,
            PlaylistTable
        },
        data() {
            return {
                exportModal: false,
                user: null,
                app_id: 334002,
                userPlaylist: null,
                isInLS: false,
                playlistsNames: []
            }
        },
        mounted() {
            this.isInLS = Boolean(localStorage.getItem('playlistData'));

            DZ.init({
                appId  : this.app_id,
                channelUrl : 'http://localhost:8080/channel',
                /*player : {
                    onload : this.onPlayerLoaded
                }*/
            });

            DZ.getLoginStatus((response) => {
                if (response.status === 'connected') {
                    DZ.api('/user/me', (res) => {
                        if (!res.error) this.user = res;
                    });
                }
            });
        },
        computed: {
            ...mapState([
                'plStatus',
                'playlist'
            ]),
            ...mapGetters([
                'getSelectedTracks',
                'getDuplicateTracks',
                'getExportPlaylists'
            ])
        },
        methods: {
            loadFromLS() { // TODO (17.03.2019): Add indexedDB
                const pl = JSON.parse(localStorage.getItem('playlistData'));
                this.setPlaylist(pl);
            },
            deezerLogIn() {
                DZ.login((response) => {
                    if (response.authResponse) {
                        DZ.api('/user/me', (res) => {
                            this.user = res;
                        });
                    } else {
                        alert('User cancelled login or did not fully authorize.');
                    }
                }, { perms: 'basic_access,manage_library' });
            },
            exportPlaylist() {
                DZ.getLoginStatus((response) => {
                    console.log(this.plStatus);
                    if (response.status === 'connected') {
                        if (this.plStatus === 'fetched') this.exportModal = true; // TODO (31.03.2019) Finish playlist import logic with vuex store.
                    } else {
                        this.deezerLogIn();
                    }
                });
            },
            exportToDeezer() {
                const pl = this.getExportPlaylists.map((item, index) => ({...item, name: this.playlistsNames[index] || item.name}));

                API.exportPlaylistToDeezer(pl)
                    .then(() => {
                        console.log('all playlists were added');
                    })
                    .catch(console.error);
            },
            changePlaylistName(value, index) {
                this.playlistsNames[index] = value;
            },
            saveMissedTracks() {
                const missedTracks = this.playlist.reduce((acc, item) => {
                    const {deezer, ...rest} = item;
                    if (!deezer) acc.push(rest);
                    return acc;
                }, []);
                this.downloadObjectAsJson(missedTracks);
            },
            downloadObjectAsJson(exportObj, exportName = 'missed_tracks') {
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, '\t'));
                const downloadAnchorNode = document.createElement('a');
                downloadAnchorNode.setAttribute("href", dataStr);
                downloadAnchorNode.setAttribute("download", exportName + ".json");
                document.body.appendChild(downloadAnchorNode); // required for firefox
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
            },
            onPlayTrack(track) {
                DZ.player.playTracks([track.deezer.id]);
                DZ.player.play();
            },

            ...mapActions([
                'fetchAllPlaylist',
            ]),
            ...mapMutations([
                'setPlaylist'
            ]),
        }
    }
</script>
