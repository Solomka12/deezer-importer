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

            <TrackEditDialog :selected-track="editedItem"
                             @save="onEditedTrackSave"
                             @cancel="setEditTrack(null)">
            </TrackEditDialog>
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
                        <v-icon small class="mr-2" @click="setEditTrack(props.item)">edit</v-icon>
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
    import {mapState, mapActions, mapGetters} from 'vuex';

    import TrackEditDialog from './TrackEditDialog';

    export default {
        components: {
            TrackEditDialog,
        },
        data: () => ({
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
            editedItem: null
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
            ...mapState({
                plStatus: state => state.playlist.plStatus,
                fetchedAmount: state => state.playlist.fetchedAmount,
                playlist: state => state.playlist.playlist
            }),
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

            deleteItem(item) {
                const index = this.playlist.indexOf(item);
                confirm('Are you sure you want to delete this item?') && this.removePlaylistTrack({index});
            },

            setEditTrack(track) {
                this.editedItem = track;
            },

            onEditedTrackSave(track) {
                const index = this.playlist.indexOf(this.editedItem);

                if (index >= 0) this.updatePlaylistTrack({index, track: {...this.editedItem, ...track}});

                this.setEditTrack(null);
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

            ...mapActions([
                'updatePlaylistTrack',
                'removePlaylistTrack',
                'tooglePlaylistSelection'
            ]),
        }
    }
</script>

<style lang="scss">
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

    .item-line {
        &.empty {
            background-color: rgba(255, 93, 97, 0.2);
        }
        &.warn {
            background-color: rgba(255, 183, 75, 0.2);
        }
    }
</style>
