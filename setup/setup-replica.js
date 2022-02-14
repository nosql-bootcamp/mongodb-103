rsconf = {
    _id : "rsmongo",
    members: [
        {
            "_id": 0,
            "host": "mongo-1:27017",
            "priority": 4
        },
        {
            "_id": 1,
            "host": "mongo-2:27017",
            "priority": 2
        },
        {
            "_id": 2,
            "host": "mongo-3:27017",
            "priority": 1
        }
    ]
}

rs.initiate(rsconf)