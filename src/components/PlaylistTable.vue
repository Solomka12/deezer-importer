<template>
    <div>
        <v-toolbar flat color="white">
            <v-toolbar-title>Configure Playlist</v-toolbar-title>
            <v-divider
                    class="mx-2"
                    inset
                    vertical
            ></v-divider>
            <v-spacer></v-spacer>
            <v-btn
                    color="blue"
                    dark
                    :loading="loadStatus === 'fetching'"
                    :disabled="loadStatus !== null"
                    @click="fetchAllPlaylist">Fetch Deezer Songs</v-btn>
            <v-dialog v-model="dialog" max-width="500px">
                <v-card>
                    <v-card-title>
                        <span class="headline">Edit Item</span>
                    </v-card-title>

                    <v-card-text>
                        <v-container grid-list-md>
                            <v-layout wrap>
                                <v-flex md12>
                                    <v-text-field v-model="editedItem.artist" label="Artist"></v-text-field>
                                </v-flex>
                                <v-flex md12>
                                    <v-text-field v-model="editedItem.title" label="Title"></v-text-field>
                                </v-flex>
                            </v-layout>
                        </v-container>
                    </v-card-text>

                    <v-card-actions>
                        <v-spacer></v-spacer>
                        <v-btn color="blue darken-1" flat @click="close">Cancel</v-btn>
                        <v-btn color="blue darken-1" flat @click="save">Save</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-toolbar>
        <v-data-table
                v-model="selected"
                :headers="headers"
                :items="tracks"
                :loading="loadStatus === 'fetching'"
                :pagination.sync="pagination"
                :rows-per-page-items="[5,10,25,50,{text:'$vuetify.dataIterator.rowsPerPageAll',value:-1}]"
                select-all
                class="elevation-1"
        >
            <v-progress-linear v-slot:progress color="blue" :value="30"></v-progress-linear>
            <template v-slot:items="props">
                <tr :active="props.selected" class="item-line" :class="getLineClass(props.item)">
                    <td>
                        <v-checkbox
                                :input-value="props.selected"
                                primary
                                hide-details
                        ></v-checkbox>
                    </td>
                    <td class="text-xs-right">{{ props.item.artist }}</td>
                    <td class="text-xs-left">{{ props.item.title }}</td>

                    <td class="text-xs-right">
                        <v-avatar
                                class="album-cover"
                                v-if="props.item.deezer"
                                :tile="true"
                                size="50"
                                @click="playTrack(props.item)">
                            <img :src="props.item.deezer.album.cover_small" alt="avatar">
                            <v-icon class="play-btn" large color="primary">
                                play_circle_filled
                            </v-icon>
                        </v-avatar>
                    </td>
                    <td class="text-xs-right">
                        {{ props.item.deezer ? props.item.deezer.artist.name : ''}}
                    </td>
                    <td class="text-xs-left">
                        {{ props.item.deezer ? props.item.deezer.title : ''}}
                    </td>
                    <td class="justify-center layout px-0">
                        <v-icon
                                small
                                class="mr-2"
                                @click="editItem(props.item)">
                            edit
                        </v-icon>
                        <v-icon
                                small
                                @click="deleteItem(props.item)">
                            delete
                        </v-icon>
                    </td>
                </tr>
            </template>
            <template v-slot:no-data>
                <v-btn color="primary" @click="initialize">Reset</v-btn>
            </template>
        </v-data-table>
    </div>
</template>

<script>
    import eachSeries from 'async/eachSeries';

    export default {
        props: {
            userTracks: Array
        },
        data: () => ({
            dialog: false,
            loadStatus: null,
            fetchedAmount: 0,
            headers: [
                { text: 'Artist', align: 'right', value: 'artist' },
                { text: 'Title', align: 'left', value: 'title' },
                { text: 'Album Cover', align: 'right', value: 'cover', sortable: false },
                { text: 'Deezer Artist', align: 'right', value: 'd_artist' },
                { text: 'Deezer Title', align: 'left', value: 'd_title' },
                { text: 'Actions', value: 'name', sortable: false }
            ],
            pagination: {
                rowsPerPage: 50
            },
            tracks: [],
            selected: [],
            editedIndex: -1,
            editedItem: {
                name: '',
                title: ''
            }
        }),

        watch: {
            dialog (val) {
                val || this.close()
            }
        },

        created () {
            this.initialize()
        },

        computed: {
            fetchProgressValue() {
                return this.fetchedAmount / this.tracks.length * 100;
            }
        },

        methods: {
            initialize () {
                this.tracks = JSON.parse(JSON.stringify(this.userTracks));
            },

            editItem (item) {
                this.editedIndex = this.tracks.indexOf(item);
                this.editedItem = Object.assign({}, item);
                this.dialog = true
            },

            deleteItem (item) {
                const index = this.tracks.indexOf(item);
                confirm('Are you sure you want to delete this item?') && this.tracks.splice(index, 1)
            },

            close () {
                this.dialog = false;
                setTimeout(() => {
                    this.editedItem = {name: '', title: ''};
                    this.editedIndex = -1
                }, 300)
            },

            save () {
                if (this.editedIndex > -1) {
                    Object.assign(this.tracks[this.editedIndex], this.editedItem);
                    this.getDeezerTrack(this.tracks[this.editedIndex])
                    .then(track => {
                        this.tracks[this.editedIndex].deezer = track;
                        console.log(this.tracks[this.editedIndex]);
                        this.saveCurrentTracks();
                        this.close()
                    });
                }
            },
            playTrack(track) {
                // this.$emit('playTrack', track); // TODO (10.03.2019): add custom HTML5 player
            },
            getLineClass(track) {
                if (!track.deezer || !track.deezer.artist || !track.deezer.title) return {empty: true};
                else if (
                    track.deezer.artist.name.toLowerCase() !== track.artist.trim().toLowerCase() ||
                    track.deezer.title.toLowerCase() !== track.title.trim().toLowerCase()
                ) return {warn: true}
            },
            getDeezerTrack({artist, title}) {
                return new Promise((resolve) => {
                    DZ.api(`/search?q=artist:"${artist}" track:"${title}"`, function (response) {
                        console.log(response);
                        const track = response.data.find(item => item.type === 'track');
                        resolve(track);
                    });
                });
            },
            fetchAllPlaylist() {
                this.loadStatus = 'fetching';
                eachSeries(this.tracks, (track, callback) => {
                    this.getDeezerTrack(track).then(res => {
                        this.fetchedAmount++;
                        track.deezer = res;
                        callback();
                    }).catch(callback);
                }, (err) => {
                    if( err ) console.error(err);
                    else console.log('All tracks have been processed successfully');
                    this.loadStatus = null;
                    this.saveCurrentTracks();
                });
            },
            saveCurrentTracks() {
                localStorage.setItem('playlistData', JSON.stringify(this.tracks));
            }
        }
    }
</script>

<style scoped lang="scss">
    file-drop {
        width: 20%;
        height: 80px;
        border: 1px dashed #666;
        border-radius: 10px;
        display: inline-flex;
        justify-content: center;
        align-items: center;

    }

    .album-cover {
        cursor: pointer;
        .play-btn {
            position: absolute;
            opacity: 0;
            transition: .2s opacity;
        }
        &:hover {
            .play-btn {
                opacity: 1;
            }
        }
    }

    file-drop.drop-valid {
        background-color: rgba(89, 213, 85, 0.4);
    }

    file-drop.drop-invalid {
        background-color: rgba(255, 93, 97, 0.4);
    }

    .item-line {
        &.empty {
            background-color: rgba(255, 93, 97, 0.3);
        }
        &.warn {
            background-color: rgba(255, 183, 75, 0.3);
        }
    }
</style>
