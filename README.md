# MongoDB 103

![mongo-logo](https://upload.wikimedia.org/wikipedia/fr/4/45/MongoDB-Logo.svg)

**MongoDB 103** est un workshop permettant d'installer et de configurer un cluster MongoDB.

<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/"><img alt="Creative Commons Licence" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" /></a>

<span xmlns:dct="http://purl.org/dc/terms/" property="dct:title">mongodb-103</span> par <a xmlns:cc="http://creativecommons.org/ns#" href="https://github.com/nosql-bootcamp/mongodb-103" property="cc:attributionName" rel="cc:attributionURL">Chris WOODROW, Sébastien PRUNIER et Benjamin CAVY</a> est distribué sous les termes de la licence <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons - Attribution - NonCommercial - ShareAlike</a>.

Ce workshop est basé sur la **version 4.4.3** de MongoDB.

## Pré requis

Nous considérons que vous avez déjà réalisé les workshops suivants :

* [mongodb-101](https://github.com/nosql-bootcamp/mongodb-101)

## Installation d'un cluster de test

Inspirez-vous de la documentation officielle : https://docs.mongodb.com/manual/tutorial/deploy-replica-set-for-testing/

L'idée est de démarrer 3 noeuds Mongo sur votre machine.

Dans un premier temps, créez les dossiers qui vont stocker les données des noeuds, par exemple : 

```
mkdir ~/data/mongodb-cluster
cd ~/data/mongodb-cluster
mkdir rs0-0
mkdir rs0-1
mkdir rs0-2
```

Démarrez ensuite les 3 noeuds, en précisant pour chaque noeud un port différent et le dossier de stockage des données adéquat :

```
mongod --replSet rs0 --port 27017 --dbpath ~/data/mongodb-cluster/rs0-0
mongod --replSet rs0 --port 27018 --dbpath ~/data/mongodb-cluster/rs0-1
mongod --replSet rs0 --port 27019 --dbpath ~/data/mongodb-cluster/rs0-2
```

Connectez-vous ensuite au premier noeud : 

```
mongo --port 27017
```

Définissez la configuration du cluster dans le shell Mongo : 

```javascript
rsconf = {
  "_id": "rs0",
  "members": [
    {
     "_id": 0,
     "host": "localhost:27017"
    },
    {
     "_id": 1,
     "host": "localhost:27018"
    },
    {
     "_id": 2,
     "host": "localhost:27019"
    }
   ]
}
```

Puis initialisez le cluster à partir de cette configuration : 

```javascript
rs.initiate(rsconf)
```

Vérifiez enfin que le cluster est correctement créé à l'aide de la commande `rs.status()`. Recherchez dans le résultat de la commande le statut du noeud `PRIMARY` :

```javascript
{
  "_id": 0,
  "name": "localhost:27017",
  "health": 1,
  "state": 1,
  "stateStr": "PRIMARY",
  "uptime": 194,
  "optime": {
    "ts": Timestamp(1581680710, 1),
    "t": NumberLong("1")
  },
  "optimeDate": ISODate("2020-02-14T11:45:10Z"),
  "syncingTo": "",
  "syncSourceHost": "",
  "syncSourceId": -1,
  "infoMessage": "",
  "electionTime": Timestamp(1581680589, 1),
  "electionDate": ISODate("2020-02-14T11:43:09Z"),
  "configVersion": 1,
  "self": true,
  "lastHeartbeatMessage": ""
}
```

## Vie du cluster

Essayez plusieurs choses sur le cluster Mongo :

* **Arrêtez un noeud secondaire** et vérifiez le statut du cluster, notamment celui du noeud arrêté

```javascript
{
  "_id": 2,
  "name": "localhost:27019",
  "health": 0,
  "state": 8,
  "stateStr": "(not reachable/healthy)",
  "uptime": 0,
  "optime": {
    "ts": Timestamp(0, 0),
    "t": NumberLong("-1")
  },
  "optimeDurable": {
    "ts": Timestamp(0, 0),
    "t": NumberLong("-1")
  },
  "optimeDate": ISODate("1970-01-01T00:00:00Z"),
  "optimeDurableDate": ISODate("1970-01-01T00:00:00Z"),
  "lastHeartbeat": ISODate("2020-02-14T13:05:39.473Z"),
  "lastHeartbeatRecv": ISODate("2020-02-14T13:05:25.702Z"),
  "pingMs": NumberLong("0"),
  "lastHeartbeatMessage": "Error connecting to localhost:27019 (127.0.0.1:27019) :: caused by :: Connection refused",
  "syncingTo": "",
  "syncSourceHost": "",
  "syncSourceId": -1,
  "infoMessage": "",
  "configVersion": -1
}
```

* **Arrêtez le deuxième noeud secondaire** et regardez ce qui se passe au niveau du statut du seul noeud restant (il n'y a plus de noeud primaire)

```javascript
{
  "_id": 0,
  "name": "localhost:27017",
  "health": 1,
  "state": 2,
  "stateStr": "SECONDARY",
  "uptime": 5085,
  "optime": {
    "ts": Timestamp(1581685598, 1),
    "t": NumberLong("2")
  },
  "optimeDate": ISODate("2020-02-14T13:06:38Z"),
  "syncingTo": "",
  "syncSourceHost": "",
  "syncSourceId": -1,
  "infoMessage": "could not find member to sync from",
  "configVersion": 1,
  "self": true,
  "lastHeartbeatMessage": ""
}
```

* **Essayez d'insérer un document** via le seul noeud restant, l'écriture est impossible car il n'y a plus de noeud primaire

```
test> db.person.insert({name: "toto"})
```

```javascript
WriteCommandError({
  "operationTime": Timestamp(1581685598, 1),
  "ok": 0,
  "errmsg": "not master",
  "code": 10107,
  "codeName": "NotMaster",
  "$clusterTime": {
    "clusterTime": Timestamp(1581685598, 1),
    "signature": {
      "hash": BinData(0, "AAAAAAAAAAAAAAAAAAAAAAAAAAA="),
      "keyId": NumberLong("0")
    }
  }
})
```

* **Redémarrez les deux noeuds précédemment arrêtés**, le cluster revient dans un état normal.

* **Arrêtez le noeud primaire** et regardez l'évolution du statut du cluster : un nouveau noeud primaire a été élu. Prenez le temps d'analyser les logs des noeuds. Extraits intéressants : 

```
2020-02-14T14:08:14.203+0100 I  REPL     [replexec-32] Member localhost:27019 is now in state RECOVERING
2020-02-14T14:08:14.703+0100 I  REPL     [replexec-32] Member localhost:27019 is now in state SECONDARY
2020-02-14T14:08:15.064+0100 I  ELECTION [replexec-34] Starting an election, since we've seen no PRIMARY in the past 10000ms
2020-02-14T14:08:15.064+0100 I  ELECTION [replexec-34] conducting a dry run election to see if we could be elected. current term: 3
2020-02-14T14:08:15.064+0100 I  REPL     [replexec-34] Scheduling remote command request for vote request: RemoteCommand 5742 -- target:localhost:27018 db:admin cmd:{ replSetRequestVotes: 1, setName: "rs0", dryRun: true, term: 3, candidateIndex: 0, configVersion: 1, lastCommittedOp: { ts: Timestamp(1581685598, 1), t: 2 } }
2020-02-14T14:08:15.064+0100 I  REPL     [replexec-34] Scheduling remote command request for vote request: RemoteCommand 5743 -- target:localhost:27019 db:admin cmd:{ replSetRequestVotes: 1, setName: "rs0", dryRun: true, term: 3, candidateIndex: 0, configVersion: 1, lastCommittedOp: { ts: Timestamp(1581685598, 1), t: 2 } }
2020-02-14T14:08:15.065+0100 I  ELECTION [replexec-32] VoteRequester(term 3 dry run) received a yes vote from localhost:27018; response message: { term: 3, voteGranted: true, reason: "", ok: 1.0, $clusterTime: { clusterTime: Timestamp(1581685598, 1), signature: { hash: BinData(0, 0000000000000000000000000000000000000000), keyId: 0 } }, operationTime: Timestamp(1581685598, 1) }
2020-02-14T14:08:15.066+0100 I  ELECTION [replexec-32] dry election run succeeded, running for election in term 4
2020-02-14T14:08:15.075+0100 I  REPL     [replexec-32] Scheduling remote command request for vote request: RemoteCommand 5744 -- target:localhost:27018 db:admin cmd:{ replSetRequestVotes: 1, setName: "rs0", dryRun: false, term: 4, candidateIndex: 0, configVersion: 1, lastCommittedOp: { ts: Timestamp(1581685598, 1), t: 2 } }
2020-02-14T14:08:15.076+0100 I  REPL     [replexec-32] Scheduling remote command request for vote request: RemoteCommand 5745 -- target:localhost:27019 db:admin cmd:{ replSetRequestVotes: 1, setName: "rs0", dryRun: false, term: 4, candidateIndex: 0, configVersion: 1, lastCommittedOp: { ts: Timestamp(1581685598, 1), t: 2 } }
2020-02-14T14:08:15.091+0100 I  ELECTION [replexec-34] VoteRequester(term 4) received a yes vote from localhost:27019; response message: { term: 4, voteGranted: true, reason: "", ok: 1.0, $clusterTime: { clusterTime: Timestamp(1581685598, 1), signature: { hash: BinData(0, 0000000000000000000000000000000000000000), keyId: 0 } }, operationTime: Timestamp(1581685518, 1) }
2020-02-14T14:08:15.091+0100 I  ELECTION [replexec-34] election succeeded, assuming primary role in term 4
2020-02-14T14:08:15.091+0100 I  REPL     [replexec-34] transition to PRIMARY from SECONDARY
...
```
