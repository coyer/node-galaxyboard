var privateFlags = {
    board: {
        general: {
            closed: 1 << 0, // unused // the board is closed
            noRegistration: 1 << 1, // unused // registration is not allowed currently
            approveRegistration: 1 << 2, // unused // registration need to be approved
            userAvatar: 1 << 30 // user can upload avatar
        },
        config: {
            allowBBCode: 1 << 0, // obsolete // headline and description can contain bb-code
            allowSmilies: 1 << 1, // obsolete
            allowLinks: 1 << 2, // obsolete
            allowBBCodeInBoardRule: 1 << 3, // obsolete // boardrules can contain bb-code
            allowSmiliesInBoardRule: 1 << 4, // obsolete
            allowLinksInBoardRule: 1 << 5, // obsolete
            showSubBoards: 1 << 6,
            hideBoard: 1 << 7,
            boardClosed: 1 << 8,
            forcePrefix: 1 << 9, // unused
            noNews: 1 << 10,
            dynamicMenus: 1 << 11 // unused
        }
    },
    topic: {
        closed: 1 << 0,
        modClosed: 1 << 1, // closed by admin and cannot be opened by mod
        unApproved: 1 << 2, // unused // topic not released
        pinned: 1 << 3 // topic is shown first, regardless of last update
    },
    user: {
        noPn: 1 << 0, // user doesn't want to receive messages
        noSigs: 1 << 1, // user doesn't want to see signatures
        allowUserMail: 1 << 2, // user allows sending emails by normal users
        receiveNewsletter: 1 << 3, // unused
        automaticallyOpenPM: 1 << 4, // open pm directly after receiving it,
        // obsolete // summertime: 1 << 5,
        // obsolete // noBBCodeInSignature: 1 << 6,
        // obsolete // noSmiliesInSignature: 1 << 7,
        // obsolete // noLinksInSignature: 1 << 8,
        unapproved: 1 << 27, // user has to be approved
        emailUnapproved: 1 << 28, // user mail has to be approved
        hasAvatar: 1 << 29, // user has avatar
        premium: 1 << 30,
        superAdmin: 1 << 31
    },
    post: {
        needsApproval: 1 << 0,
        hidden: 1 << 1,
        reported: 1 << 2
    },
    message: {
        read: 1 << 0,
        replied: 1 << 1,
        jsonData: 1 << 3
    },
    rights: {
        board: {
            basic: {
                postAnnouncements: 1 << 0, // unused
                useIcons: 1 << 1, // obsolete // allowed for ever
                seeBoard: 1 << 2,
                createTopic: 1 << 3,
                readBoard: 1 << 4,
                reply: 1 << 5,
                postStickies: 1 << 6, // unused
                attachFile: 1 << 16, // unused
                useBBCode: 1 << 17, // unused
                downloadFile: 1 << 18, // unused
                postFlash: 1 << 19, // obsolete/unused -> This feature will never be implemented. Flash is insecure shit.
                postImages: 1 << 20, // unused
                canUseSignature: 1 << 21,
                smilies: 1 << 22 // obsolete
            },
            extended: {
                // bumpTopic: 1 << 0 // can bump topics.
                deleteOwnPost: 1 << 1,
                editOwnPost: 1 << 2,
                // unused // canEmailTopics : 1 << 3,
                // obsolete // canPrintTopic: 1 << 4, // everyone can print a topic by using the browsers build in mechanism
                reportPost: 1 << 5,
                canSubscribe: 1 << 6, // unused
                closeOwnTopic: 1 << 7,
                // obsolete // ignoreFlood: 1 << 16, // I cannot imagine a reason why flooding should be allowed
                // unused // noApproval: 1 << 17, // can post without approval
                increaseCounter: 1 << 18,
                // unused // search: 1 << 19, can search the board

                createPolls: 1 << 24,
                // unused // votePoll: 1 << 25,
                // unused // changeVote: 1 << 26,
                // unused // voteTopic: 1 << 27
            }
        },
        post: { // related to moderator
            approve: 1 << 0,
            setAuthor: 1 << 1,
            deletePost: 1 << 2,
            editPost: 1 << 3,
            closeReports: 1 << 4, // can close and delete reports
            hidePosts: 1 << 5,
            replyOnClosedTopic: 1 << 6,
            manageBans: 1 << 8,
            seePostDetails: 1 << 9,
            createBans: 1 << 10
        },
        topic: {
            close: 1 << 16,
            join: 1 << 17, // obsolete
            move: 1 << 18,
            split: 1 << 19, // obsolete
            delete: 1 << 20,
            edit: 1 << 21,
            create: 1 << 22
        }
    }
};


if(typeof module === 'undefined') {
    flags = privateFlags;
} else {
    module.exports = privateFlags;
}
