# MongoDB 103

![mongo-logo](https://upload.wikimedia.org/wikipedia/en/thumb/4/45/MongoDB-Logo.svg/300px-MongoDB-Logo.svg.png)

**MongoDB 103** est un workshop permettant d'installer et de configurer un cluster MongoDB.

<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/"><img alt="Creative Commons Licence" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" /></a>

<span xmlns:dct="http://purl.org/dc/terms/" property="dct:title">mongodb-103</span> par <a xmlns:cc="http://creativecommons.org/ns#" href="https://github.com/nosql-bootcamp/mongodb-103" property="cc:attributionName" rel="cc:attributionURL">Chris WOODROW, Sébastien PRUNIER et Benjamin CAVY</a> est distribué sous les termes de la licence <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons - Attribution - NonCommercial - ShareAlike</a>.

Ce workshop est basé sur la **version 3.6.0** de MongoDB.

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

```json
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

```
rs.initiate(rsconf)
```

Vérifiez enfin que le cluster est correctement créé à l'aide de la commande `rs.status()`. Recherchez dans le résultat de la commande le statut du noeud `PRIMARY` :

```
{
  "_id": 2,
  "name": "localhost:27019",
  "health": 1,
  "state": 1,
  "stateStr": "PRIMARY",
  "uptime": 1875,
  "optime": {
    "ts": Timestamp(1518947943, 1),
    "t": NumberLong("12")
  },
  "optimeDurable": {
    "ts": Timestamp(1518947943, 1),
    "t": NumberLong("12")
  },
  "optimeDate": ISODate("2018-02-18T09:59:03Z"),
  "optimeDurableDate": ISODate("2018-02-18T09:59:03Z"),
  "lastHeartbeat": ISODate("2018-02-18T09:59:07.046Z"),
  "lastHeartbeatRecv": ISODate("2018-02-18T09:59:05.924Z"),
  "pingMs": NumberLong("0"),
  "electionTime": Timestamp(1518946072, 1),
  "electionDate": ISODate("2018-02-18T09:27:52Z"),
  "configVersion": 1
}
```

## Vie du cluster

Essayez plusieurs choses sur le cluster Mongo :

* **Arrêtez un noeud secondaire** et vérifiez le statut du cluster, notamment celui du noeud arrêté

```
{
  "_id": 0,
  "name": "localhost:27017",
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
  "lastHeartbeat": ISODate("2018-02-18T10:03:30.372Z"),
  "lastHeartbeatRecv": ISODate("2018-02-18T10:03:17.447Z"),
  "pingMs": NumberLong("0"),
  "lastHeartbeatMessage": "Connection refused",
  "configVersion": -1
}
```

* **Arrêtez le deuxième noeud secondaire** et regardez ce qui se passe au niveau du statut du seul noeud restant (il n'y a plus de noeud primaire)

```
{
  "_id": 2,
  "name": "localhost:27019",
  "health": 1,
  "state": 2,
  "stateStr": "SECONDARY",
  "uptime": 156020,
  "optime": {
    "ts": Timestamp(1518948343, 1),
    "t": NumberLong("12")
  },
  "optimeDate": ISODate("2018-02-18T10:05:43Z"),
  "infoMessage": "could not find member to sync from",
  "configVersion": 1,
  "self": true
}
```

* **Essayez d'insérer un document** via le seul noeud restant, l'écriture est impossible car il n'y a plus de noeud primaire

```
[SECONDARY:rs0] test> db.person.insert({name: "toto"})

not master
WriteResult({
  "writeError": {
    "code": 10107,
    "errmsg": "not master"
  }
})
```

* **Redémarrez les deux noeuds précédemment arrêtés**, le cluster revient dans un état normal.

* **Arrêtez le noeud primaire** et regardez l'évolution du statut du cluster : un nouveau noeud primaire a été élu.
