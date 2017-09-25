function addNewPreview(file, preview) {
    const nVersions = file.version != null ? file.version.length : 0;
    let latestVersionIndex = 0;

    for (let i = 0; i < nVersions; i += 1) {
        if (file.version[i].no > file.version[latestVersionIndex].no) {
            latestVersionIndex = i;
        }
    }

    preview.version = nVersions !== 0 ? file.version[latestVersionIndex].no : 1;

    if (file.preview == null) {
        file.preview = [];
    }

    file.preview.push(preview);

    return file
        .save()
        .then(() => {
            file.preview = preview;
            return file;
        });
}

module.exports = {
    addNewPreview
};
