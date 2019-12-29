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

            <v-dialog v-model="dialog" max-width="500px"> <!--TODO (17.03.2019): Add displaying of song list to chose proper one-->
                <v-card>
                    <v-card-title>
                        <span class="headline">Edit Item</span>
                    </v-card-title>

                    <v-card-text>
                        <v-container grid-list-md>
                            <v-layout wrap>
                                <v-flex md12>
                                    <v-text-field v-model.lazy="editedItem.artist" @change="findTracks" label="Artist"></v-text-field>
                                    <v-text-field v-model.lazy="editedItem.title" @change="findTracks" label="Title"></v-text-field>
                                </v-flex>
                            </v-layout>
                        </v-container>

                        <v-subheader>Found tracks</v-subheader>

                        <v-alert :value="!foundTracks.length" color="warning" icon="info" outline>Nothing Found</v-alert>

                        <v-list two-line class="tracks-list">
                            <template v-for="(item, index) in foundTracks">
                                <v-divider :key="index"></v-divider>
                                <v-list-tile :key="item.id" avatar :class="{blue: editedItem.deezer && editedItem.deezer.id === item.id}" @click="selectDeezerTrack(item)">
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
                        <v-btn color="blue darken-1" flat @click="close">Cancel</v-btn>
                        <v-btn color="blue darken-1" flat @click="save" :disabled="!editedItem.deezer">Save</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-toolbar>

        <!--TODO (14.04.2019): handle item-key with unique value-->
        <v-data-table
                v-model="getSelectedTracks"
                :headers="headers"
                :items="playlist"
                :loading="plStatus === 'fetching'"
                :pagination.sync="pagination"
                :rows-per-page-items="[5,10,25,50,{text:'$vuetify.dataIterator.rowsPerPageAll',value:-1}]"
                item-key="title"
                select-all="tooglePlaylistSelection"
				disable-initial-sort
                class="elevation-1"
        >
            <template v-slot:headers="props">
                <tr>
                    <th>
                        <v-checkbox
                                :input-value="props.all"
                                :indeterminate="props.indeterminate"
                                primary
                                hide-details
                                @click.stop="tooglePlaylistSelection"
                        ></v-checkbox>
                    </th>
                    <th
                            v-for="header in props.headers"
                            :key="header.text"
                            :class="['column sortable', pagination.descending ? 'desc' : 'asc', header.value === pagination.sortBy ? 'active' : '']"
                            @click="changeSort(header.value)"
                    >
                        <v-icon small>arrow_upward</v-icon>
                        {{ header.text }}
                    </th>
                </tr>
            </template>

            <template v-slot:progress>
                <v-progress-linear :value="fetchProgressValue"></v-progress-linear>
            </template>

            <template v-slot:items="props">
                <tr class="item-line" :class="getLineClass(props.item)">
                    <td>
                        <v-icon v-if="getLineClass(props.item).empty" color="error">error_outline</v-icon>
                        <v-checkbox
                                v-else
                                v-model="props.item.selected"
                                :color="getLineClass(props.item).warn ? 'warn' : 'primary'"
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
                            <v-icon class="play-btn" large dark>
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
                        <v-icon small class="mr-2" @click="editItem(props.item)">edit</v-icon>
                        <v-icon small @click="deleteItem(props.item)">delete</v-icon>
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
    import { mapState, mapMutations, mapGetters } from 'vuex';
    import API from '../api/index';

    export default {
        data: () => ({
            dialog: false,
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
            foundTracks: [],
            editedIndex: -1,
            editedItem: {
                artist: '',
                title: '',
                deezer: null
            }
        }),

        watch: {
            dialog(val) {
                val || this.close()
            }
        },

        computed: {
            fetchProgressValue() {
                return this.fetchedAmount / this.playlist.length * 100;
            },
            ...mapState([
                'plStatus',
                'fetchedAmount',
                'playlist'
            ]),
            ...mapGetters(['getSelectedTracks']),
        },

        methods: {
            changeSort(column) {
                if (this.pagination.sortBy === column) {
                    this.pagination.descending = !this.pagination.descending;
                } else {
                    this.pagination.sortBy = column;
                    this.pagination.descending = false;
                }
            },

            editItem(item) {
                this.editedIndex = this.playlist.indexOf(item);
                this.editedItem = Object.assign({}, item);
                this.findTracks();
                this.dialog = true;
            },

            deleteItem(item) {
                const index = this.playlist.indexOf(item);
                confirm('Are you sure you want to delete this item?') && this.removePlaylistTrack({index});
            },

            findTracks() {
                API.findDeezerTracks(this.editedItem)
                    .then(res => this.foundTracks = res)
                    .catch(console.error);
            },

            selectDeezerTrack(track) {
                this.editedItem.deezer = track;
                this.foundTracks = [...this.foundTracks];
            },

            close() {
                this.dialog = false;
                setTimeout(() => {
                    this.foundTracks = [];
                    this.editedItem = {artist: '', title: '', deezer: null};
                    this.editedIndex = -1
                }, 300)
            },

            save() {
                if (this.editedIndex > -1) {
                    this.updatePlaylistTrack({
                        index: this.editedIndex,
                        track: this.editedItem
                    });
                    this.dialog = false;
                }
            },

            playTrack(track) {
                this.$emit('playTrack', track); // TODO (10.03.2019): add custom HTML5 player
            },

            getLineClass(track) {
                if (!track.deezer || !track.deezer.artist || !track.deezer.title) return {empty: true};
                else if (
                    track.deezer.artist.name.toLowerCase() !== track.artist.trim().toLowerCase() ||
                    track.deezer.title.toLowerCase() !== track.title.trim().toLowerCase()
                ) return {warn: true};
                else return {};
            },

            ...mapMutations([
                'updatePlaylistTrack',
                'removePlaylistTrack',
                'tooglePlaylistSelection'
            ]),
        }
    }
</script>

<style lang="scss">
    #dz-root {
        position: fixed;
        bottom: 0;
        z-index: 5;
        width: 60% !important;
        height: 92px !important;
    }

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
            background-color: rgba(0,0,0,0.6);
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

    .tracks-list {
        overflow: auto;
        max-height: 300px;
    }

    .item-line {
        &.empty {
            background-color: rgba(255, 93, 97, 0.2);
        }
        &.warn {
            background-color: rgba(255, 183, 75, 0.2);
        }
    }
</style>
