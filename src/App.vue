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
            <div v-if="!userPlaylist" style="text-align: center;">
                <PlaylistReader @dataParse="onDataParse"/>
                <v-btn v-if="isInLS" flat @click="loadFromLS"><span class="mr-2">Load from previous session</span></v-btn>
            </div>

            <PlaylistTable ref="playlistTable" v-if="userPlaylist" :userTracks="userPlaylist" @playTrack="onPlayTrack"/>
        </v-content>

        <v-footer app class="py-2 px-3" height="auto" color="secondary lighten-1">
            <div class="player">
                <v-btn icon color="accent">
                    <v-icon>play_arrow</v-icon>
                </v-btn>
            </div>
            <v-spacer></v-spacer>
            <v-btn light color="accent" @click="importPlaylist">
                <span>Import Playlist</span>
            </v-btn>
        </v-footer>

        <v-dialog v-model="dialog" width="800px">
            <v-card>
                <v-card-title
                        class="grey lighten-4 py-4 title"
                >
                    Playlists creation
                </v-card-title>

                <v-list three-line subheader>
                    <v-subheader>General Info</v-subheader>
                    <v-list-tile avatar>
                        <v-list-tile-content>
                            <v-list-tile-title>Tracks will be imported:</v-list-tile-title>
                            <v-list-tile-sub-title>{{properTracksAmount}}/{{allTracksAmount}}</v-list-tile-sub-title>
                        </v-list-tile-content>
                    </v-list-tile>
                </v-list>
                <v-divider></v-divider>
                <v-container grid-list-sm class="pa-4">
                    <v-layout row wrap>
                        <v-flex v-for="(playlist, index) in playlistNames" xs12>
                            <v-text-field
                                    prepend-icon="playlist_play"
                                    placeholder="Playlist Title"
                                    :value="playlist"
                                    @change="changePlaylistName($event, index)"
                            ></v-text-field>
                        </v-flex>
                    </v-layout>
                </v-container>
                <v-card-actions>
                    <v-btn flat color="primary" @click="dialog = false">Cancel</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn flat color="orange"><v-icon left>insert_drive_file</v-icon>Save missed tracks</v-btn>
                    <v-btn flat @click="importToDeezer"><v-icon left>cloud_upload</v-icon>Import to Deezer</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-app>
</template>

<script>
    import PlaylistReader from './components/PlaylistReader'
    import PlaylistTable from './components/PlaylistTable'

    export default {
        name: 'App',
        components: {
            PlaylistReader,
            PlaylistTable
        },
        data() {
            return {
                dialog: false,
                user: null,
                app_id: 334002,
                userPlaylist: null,
                isInLS: false,
                allTracksAmount: 0,
                properTracksAmount: 0,
                songIds: null,
                playlistNames: []
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
        methods: {
            onDataParse(data) {
                console.log(data);
                this.userPlaylist = data;
            },
            loadFromLS() {
                this.userPlaylist = JSON.parse(localStorage.getItem('playlistData'));
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
            importPlaylist() {
                DZ.getLoginStatus((response) => {
                    if (response.status === 'connected') {
                        if (this.$refs.playlistTable) this.openImportModal();
                    } else {
                        this.deezerLogIn();
                    }
                });
            },
            openImportModal() {
                const allTracks = this.$refs.playlistTable.tracks;
                const properTracks = allTracks.filter(item => item.deezer).map(item => item.deezer.id);
                this.allTracksAmount = allTracks.length;
                this.properTracksAmount = properTracks.length;
                this.songIds = properTracks.join(); // TODO (10.03.2019) Combine playlist names and songs for it in one obj
                console.log(this.songIds);
                const playlistAmount = Math.ceil(this.properTracksAmount / 2000);
                const arr = [];
                for (let i=0; i < playlistAmount; i++) {
                    arr[i] = 'Deezer Importer Playlist-' + (i + 1);
                }
                this.playlistNames = arr;

                this.dialog = true;
            },
            importToDeezer() {
                const promises = this.playlistNames.map(title => {
                    return new Promise(resolve => {
                        DZ.api('user/me/playlists', 'POST', {title}, (response) => {
                            console.log("My new playlist ID", response.id);
                            DZ.api(`playlist/${response.id}/tracks`, 'POST', {songs: this.songIds}, (response) => {
                                console.log("Songs were added",);
                                resolve(response);
                            });
                        });
                    })
                });

                Promise.all(promises).then(res => {
                    console.log('all playlists were added');
                })
            },
            changePlaylistName(value, index) {
                this.playlistNames[index] = value;
            },
            onPlayTrack(track) {
                DZ.player.playTracks([track.deezer.id]);
                DZ.player.play();
            }
        }
    }
</script>
