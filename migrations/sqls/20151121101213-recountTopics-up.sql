UPDATE boards SET topiccount = (
    SELECT count(*)
    FROM topics
    WHERE topics.boardid = boards.boardid
    AND NOT topics.isDeleted
);