export function getDeezerTrack({artist, title}) {
    return new Promise((resolve) => {
        let allowed = false;
        let track = null;

        setTimeout(() => {
            console.log(allowed, track);
            if (track !== null) resolve(track);
            else allowed = true;
        }, 100);

        DZ.api(`/search?q=artist:"${artist}" track:"${title}"`, function (response) {
            console.log(response);
            const fetchedTrack = response.data.find(item => item.type === 'track');
            if (allowed) resolve(fetchedTrack);
            else track = fetchedTrack;
        });
    });
}
