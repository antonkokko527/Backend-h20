const Promise = require('bluebird');

function getDirectoryNameAndParentPath(path) {
    let p = path.trim();
    const len = p.length;
    if (p[len - 1] === '/') {
        p = p.slice(0, -1);
    }

    const indexOfLastSlash = p.lastIndexOf('/');
    const directory = p.substr(indexOfLastSlash + 1);
    const parentPath = p.slice(0, indexOfLastSlash);

    return {
        parentPath: parentPath === '' ? '/' : parentPath,
        directory: directory === '' ? '/' : directory
    };
}

function countVotes(obj, opts) {
    console.log('opts', opts);
    let up = 0;
    let down = 0;
    let userVote = 0;

    return Promise.each(obj.votes, (vote) => {
        if (vote.type === 1) up += 1;
        else down += 1;

        if (opts != null && opts.userId != null) {
            if (vote.user != null && vote.user.equals(opts.userId)) userVote = vote.type;
        }
    }).then(() => {
        const votes = { up, down, userVote };
        obj.votes = votes;

        if (opts) {
            if (opts.userVote != null) votes.userVote = opts.userVote;
            if (opts.votesOnly === true) return votes;
        }

        return obj;
    });
}

module.exports = {
    getDirectoryNameAndParentPath,
    countVotes
};
