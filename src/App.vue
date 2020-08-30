<template>
    <v-app>
        <v-toolbar app>
            <v-toolbar-title class="headline text-uppercase">
                <span>Deezer</span>
                <span class="font-weight-light"> Playlist Importer</span>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <div v-if="isLoggedIn" class="headline">Hello, {{user.name}}</div>
            <v-btn v-else flat @click="login">
                <span>LogIn</span>
            </v-btn>
        </v-toolbar>

        <v-content>
            <PlaylistTable v-if="playlist.length" @playTrack="onPlayTrack"/>

            <div v-else style="text-align: center;">
                <PlaylistReader/>
                <v-btn v-if="isInLS" flat @click="loadFromLS"><span>Load from previous session</span></v-btn>
            </div>
        </v-content>

        <v-footer v-if="plStatus !== 'none'" app height="90">

            <AudioPlayer/>

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

        <ExportModal v-model="exportModalActive"/>

        <InfoSnackbar/>
    </v-app>
</template>

<script>
    import {mapState, mapGetters, mapActions} from 'vuex';
    import lf from 'localforage';
    import PlaylistReader from './components/PlaylistReader';
    import PlaylistTable from './components/PlaylistTable';
    import AudioPlayer from './components/AudioPlayer';
    import ExportModal from './components/ExportModal';
    import InfoSnackbar from './components/InfoSnackbar';
    import {initializeDeezerPlayer} from "./services/deezer.player";
    import {APP_ID, PLAYER_TYPES} from "./constants/constants";

    export default {
        name: 'App',
        components: {
            PlaylistReader,
            PlaylistTable,
            AudioPlayer,
            ExportModal,
            InfoSnackbar
        },
        data() {
            return {
                exportModalActive: false,
                isInLS: false
            }
        },
        mounted() {
            lf.keys()
            .then(keys => this.isInLS = keys)
            .catch(err=> console.log(err));

            window.dzAsyncInit = () => {
                window.DZ.init({
                    appId  : APP_ID,
                    channelUrl : 'http://localhost:8080/channel',
                    player : {
                        onload: this.onPlayerLoaded
                    }
                });

                window.DZ.ready(() => {
                    window.DZ.getLoginStatus(response => {
                        if (response.status === 'connected') {
                            window.DZ.api('/user/me', res => {
                                if (res.error) return;

                                this.setUser(res);
                                this.setPlayerType(PLAYER_TYPES.AUDIO);
                            });
                        }
                    });
                });
            };

            (function() {
                const e = document.createElement('script');
                e.src = 'https://e-cdns-files.dzcdn.net/js/min/dz.js';
                e.async = true;
                document.getElementById('dz-root').appendChild(e);
            })();
        },
        computed: {
            ...mapState({
                user: state => state.user.userInfo,
                plStatus: state => state.playlist.plStatus,
                playlist: state => state.playlist.playlist
            }),
            ...mapGetters([
                'isLoggedIn'
            ])
        },
        methods: {
            loadFromLS() {
                // const pl = JSON.parse(localStorage.getItem('playlistData'));
                
                lf.getItem('playlistData', (err, pl) => {
                    if (err) console.error(err);
                    else {
                        this.setInitialPlaylist(pl);
                        this.setPlaylistStatus('fetched');
                    }
                });
            },
            exportPlaylist() {
                window.DZ.getLoginStatus((response) => {
                    if (response.status === 'connected') {
                        if (this.plStatus === 'fetched') this.exportModalActive = true;
                    } else {
                        this.login();
                    }
                });
            },
            onPlayTrack(track) {
                this.play(track.deezer);
            },
            onPlayerLoaded(e) {
                initializeDeezerPlayer();
                this.setPlayerType(PLAYER_TYPES.DEEZER);
                console.log('Player loaded:', e);
            },

            ...mapActions([
                'login',
                'setUser',
                'fetchAllPlaylist',
                'setInitialPlaylist',
                'setPlaylistStatus',
                'play',
                'setPlayerType'
            ])
        }
    }
</script>
