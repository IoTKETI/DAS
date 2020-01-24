# DAS Installation
-------------------

## DAS install procedure ( Azure Ubuntu Server 18.04 LTS )

## 1.MySQL
```
$ sudo apt update
$ sudo apt install mysql-client
$ sudo apt install mysql-server
$ sudo service mysql start
```

## 2.Node.js
### 2.1 nvm install
```
git clone https://github.com/creationix/nvm.git ~/.nvm
source ~/.nvm/nvm.sh
```

### 2.2 node install (ver12.9.0)
```
$ nvm ls-remote
$ nvm install 12.9.0
$ node -v
v12.9.0
```

### 2.3 node install (Obsolete)
```
$ curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
$ sudo apt install -y nodejs
$ node -v
v8.10.0
```

## 3.DAS Server
### 3.1 DAS Install

```
$ cd ~/
$ git clone https://github.com/IoTKETI/DAS.git
$ cd DAS/
$ npm install
```

### 3.2 Import data into mysql

```
$ mysql -u root -p
mysql> create database dasdb;
mysql> exit

```
Import data into dassdb database
```
$ mysql -u root -p dasdb < ~/DAS/das/dasdb.sql
```

### 3.3 Configure DAS setup file

```
$ sudo vi ~/DAS/conf.json
```

csebaseport is the service port number for DAS server

```
{
	"dasbaseport": Port number of DAS server
	"dbpass": Password to access mysql
}

(sample)
{
	"dasbaseport": "7580"
	"dbpass": "password"
}
```

### 3.4 Start DAS server

```
$ node dasserver.js
Start DAS server!
Connecting to mysql!
das server (http) (10.0.75.1) running at 7580 port
```

### 3.5 Starting DAS in background

```
$ nohup node dasserver.js &
```

## 4. DAS-AE

### 4.1 Configure DAS-AE setup file

```
$ sudo vi ~/DAS/conf-ae.json
```

dasaebaseport is the service port number for DAS-AE module

```
{
    "dasaebaseport": Port number of DAS-AE module
}

(sample)
{
    "dasaebaseport": "7581"
}
```

### 4.2 Configure CSE/DAS info
```
$ sudo vi ~/DAS/das-ae.js
```


```
// DAS information
 global.usedashost	    = 'localhost';
 global.usedasport	    = '7580';

// CSE information
 global.usecsehost      = 'ocean.local.com';
 global.usecseport      = '7579';
 global.usespid         = '//sample.a';
 global.usecseid        = '/mb-cse-a';
 global.usecsebase      = 'mb-base-a';
```


### 4.3 Start DAS-AE  module

```
$ node das-ae.js
Start DAS-AE!
DAS-AEID= SxOdKDLb9ty
das-ae (http) (10.0.75.1) running at 7581 port
```

## A.Testing tools

[Postman](https://www.getpostman.com/)

[SwaggerEditor](https://editor.swagger.io/)

[End]

